const express = require('express');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { requireAuth, requireRole } = require('../middleware/auth');
const { computeBedsAvailable } = require('../utils/beds');
const { generateDoctorSlots } = require('../utils/slots');

const router = express.Router();

// ---------- List hospitals for the booking dropdown ----------
router.get('/hospitals', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const hospitals = await Hospital.find()
      .select('hospitalName city address departments bedsTotal location photoUrl');

    const withBeds = await Promise.all(
      hospitals.map(async (h) => ({
        _id: h._id,
        hospitalName: h.hospitalName,
        city: h.city,
        address: h.address,
        departments: h.departments,
        location: h.location,
        photoUrl: h.photoUrl,
        bedsAvailable: await computeBedsAvailable(h),
        bedsTotal: h.bedsTotal,
      }))
    );

    res.json(withBeds);
  } catch (error) {
    console.error('Error listing hospitals:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Preview a hospital's doctors (before booking) ----------
router.get('/hospitals/:id/doctors', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const doctors = await Doctor.find({ hospital: req.params.id })
      .select('name specialization experienceYears availability photoUrl')
      .sort({ name: 1 });
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching hospital doctors:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Slot availability for a department, on a given date ----------
// Merges every non-on-leave doctor's individual schedule in this
// department into one shared grid: a time is "available" if at least
// one doctor is free then, so the patient never picks a specific
// doctor — same auto-assignment model as booking itself.
router.get('/hospitals/:id/departments/:department/slots', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'A date is required.' });
    }

    const doctors = await Doctor.find({
      hospital: req.params.id,
      specialization: req.params.department,
      availability: { $ne: 'on-leave' },
    });

    if (doctors.length === 0) {
      return res.json([]);
    }

    const bookedByDoctor = new Map();
    const appointments = await Appointment.find({
      doctor: { $in: doctors.map((d) => d._id) },
      date,
      status: 'scheduled',
    }).select('doctor time');
    appointments.forEach((a) => {
      const key = String(a.doctor);
      if (!bookedByDoctor.has(key)) bookedByDoctor.set(key, new Set());
      bookedByDoctor.get(key).add(a.time);
    });

    const availableTimes = new Set();
    const allTimes = new Set();

    doctors.forEach((doc) => {
      const taken = bookedByDoctor.get(String(doc._id)) || new Set();
      generateDoctorSlots(doc, date).forEach((time) => {
        allTimes.add(time);
        if (!taken.has(time)) availableTimes.add(time);
      });
    });

    const slots = Array.from(allTimes)
      .sort()
      .map((time) => ({ time, available: availableTimes.has(time) }));

    res.json(slots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Book an appointment ----------
router.post('/appointments', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const { hospitalId, department, date, time, requiresBed, isEmergency } = req.body;

    if (!hospitalId || !department) {
      return res.status(400).json({ message: 'Hospital and department are required.' });
    }
    if (!isEmergency && (!date || !time)) {
      return res.status(400).json({ message: 'Date and time are required for a scheduled visit.' });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    const patient = await Patient.findById(req.auth.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const candidateDoctors = await Doctor.find({
      hospital: hospitalId,
      specialization: department,
      availability: { $ne: 'on-leave' },
    });

    if (candidateDoctors.length === 0) {
      return res.status(400).json({ message: `No available doctors in ${department} at this hospital right now.` });
    }

    let bookingDate = date;
    let bookingTime = time;
    let eligibleDoctors = candidateDoctors;

    if (isEmergency) {
      // Skip the slot grid entirely — an emergency can't wait for a
      // free 30-minute square. Use second-level precision on the
      // timestamp so simultaneous emergencies routed to the same
      // doctor don't collide with the scheduled-visit uniqueness
      // guard (multiple urgent patients queuing to one doctor within
      // the same minute is normal triage, not a booking conflict).
      const now = new Date();
      bookingDate = now.toISOString().slice(0, 10);
      bookingTime = now.toTimeString().slice(0, 8); // HH:MM:SS
    } else {
      // Scheduled visit — only doctors who are actually free at this
      // exact slot are eligible, re-checked here even though the
      // frontend already showed a slot grid (that grid can go stale
      // between page load and submit).
      const appointmentsAtTime = await Appointment.find({
        doctor: { $in: candidateDoctors.map((d) => d._id) },
        date,
        time,
        status: 'scheduled',
      }).select('doctor');
      const bookedDoctorIds = new Set(appointmentsAtTime.map((a) => String(a.doctor)));

      eligibleDoctors = candidateDoctors.filter((doc) => {
        if (bookedDoctorIds.has(String(doc._id))) return false;
        const daySlots = generateDoctorSlots(doc, date);
        return daySlots.includes(time);
      });

      if (eligibleDoctors.length === 0) {
        return res.status(409).json({ message: 'That slot was just taken — please pick another time.' });
      }
    }

    const loadCounts = await Appointment.aggregate([
      { $match: { doctor: { $in: eligibleDoctors.map((d) => d._id) }, status: 'scheduled' } },
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
    ]);
    const loadMap = new Map(loadCounts.map((l) => [String(l._id), l.count]));

    const assignedDoctor = eligibleDoctors.reduce((least, doc) => {
      const load = loadMap.get(String(doc._id)) || 0;
      const leastLoad = loadMap.get(String(least._id)) || 0;
      return load < leastLoad ? doc : least;
    }, eligibleDoctors[0]);

    if (requiresBed) {
      const bedsAvailable = await computeBedsAvailable(hospital);
      if (bedsAvailable <= 0) {
        return res.status(400).json({ message: 'No beds currently available at this hospital.' });
      }
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        patient: patient._id,
        patientName: patient.fullName,
        hospital: hospital._id,
        doctor: assignedDoctor._id,
        department,
        date: bookingDate,
        time: bookingTime,
        requiresBed: !!requiresBed,
        isEmergency: !!isEmergency,
      });
    } catch (createError) {
      // The DB-level unique index caught a race we missed above — two
      // requests slipped through the earlier check at nearly the same
      // instant. Tell the patient to just try again / pick another slot.
      if (createError.code === 11000) {
        return res.status(409).json({ message: 'That slot was just taken — please pick another time.' });
      }
      throw createError;
    }

    res.status(201).json({
      appointment,
      assignedDoctor: {
        name: assignedDoctor.name,
        specialization: assignedDoctor.specialization,
      },
      hospitalName: hospital.hospitalName,
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- A patient's own appointments ----------
router.get('/appointments/mine', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.auth.id })
      .populate('doctor', 'name specialization')
      .populate('hospital', 'hospitalName city')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Cancel an appointment ----------
// No bed bookkeeping needed here anymore — bedsAvailable is computed
// live, so cancelling just changes status and the count updates itself.
router.put('/appointments/:id/cancel', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.auth.id });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appointment.status !== 'cancelled') {
      appointment.status = 'cancelled';
      await appointment.save();
    }
    res.json(appointment);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;