const express = require('express');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---------- List hospitals for the booking dropdown ----------
// Any logged-in patient can browse hospitals — not hospital-role gated.
router.get('/hospitals', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const hospitals = await Hospital.find()
      .select('hospitalName city address departments bedsAvailable');
    res.json(hospitals);
  } catch (error) {
    console.error('Error listing hospitals:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Book an appointment ----------
// Assigns the least-loaded available doctor in the chosen department at
// the chosen hospital. If requiresBed is true, holds one bed on the
// hospital for the duration of the appointment (released on cancel).
router.post('/appointments', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const { hospitalId, department, date, time, requiresBed } = req.body;

    if (!hospitalId || !department || !date || !time) {
      return res.status(400).json({ message: 'Hospital, department, date, and time are required.' });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    const patient = await Patient.findById(req.auth.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    // Find doctors in this department at this hospital who aren't on leave,
    // then pick whichever currently has the fewest active appointments —
    // this is the "traffic divergence" load-balancing across doctors.
    const candidateDoctors = await Doctor.find({
      hospital: hospitalId,
      specialization: department,
      availability: { $ne: 'on-leave' },
    });

    if (candidateDoctors.length === 0) {
      return res.status(400).json({ message: `No available doctors in ${department} at this hospital right now.` });
    }

    const loadCounts = await Appointment.aggregate([
      { $match: { doctor: { $in: candidateDoctors.map((d) => d._id) }, status: 'scheduled' } },
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
    ]);
    const loadMap = new Map(loadCounts.map((l) => [String(l._id), l.count]));

    const assignedDoctor = candidateDoctors.reduce((least, doc) => {
      const load = loadMap.get(String(doc._id)) || 0;
      const leastLoad = loadMap.get(String(least._id)) || 0;
      return load < leastLoad ? doc : least;
    }, candidateDoctors[0]);

    if (requiresBed) {
      if (hospital.bedsAvailable <= 0) {
        return res.status(400).json({ message: 'No beds currently available at this hospital.' });
      }
      hospital.bedsAvailable -= 1;
      await hospital.save();
    }

    const appointment = await Appointment.create({
      patient: patient._id,
      patientName: patient.fullName,
      hospital: hospital._id,
      doctor: assignedDoctor._id,
      department,
      date,
      time,
      requiresBed: !!requiresBed,
    });

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

// ---------- Cancel an appointment (releases the held bed, if any) ----------
router.put('/appointments/:id/cancel', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.auth.id });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appointment.status === 'cancelled') {
      return res.json(appointment);
    }

    if (appointment.requiresBed) {
      const hospital = await Hospital.findById(appointment.hospital);
      if (hospital) {
        hospital.bedsAvailable = Math.min(hospital.bedsAvailable + 1, hospital.bedsTotal);
        await hospital.save();
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;