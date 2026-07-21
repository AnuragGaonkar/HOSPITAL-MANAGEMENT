const express = require('express');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const EmergencyRequest = require('../models/EmergencyRequest');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateAmbulanceId() {
  return `AMB-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Rough ETA from distance — assumes ~30km/h effective ambulance speed
// accounting for city traffic, clamped to a believable range.
function estimateEtaMinutes(distanceKm) {
  return Math.min(25, Math.max(4, Math.round((distanceKm / 30) * 60)));
}

// ---------- Trigger an emergency dispatch ----------
router.post('/', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ message: 'Your location is required to dispatch help.' });
    }

    const patient = await Patient.findById(req.auth.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const hospitals = await Hospital.find({ 'location.lat': { $ne: null } });
    if (hospitals.length === 0) {
      return res.status(503).json({ message: 'No hospitals are available for dispatch right now.' });
    }

    let nearestHospital = null;
    let nearestDistance = Infinity;
    hospitals.forEach((h) => {
      const d = haversineKm(lat, lng, h.location.lat, h.location.lng);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearestHospital = h;
      }
    });

    // Prefer a doctor in the Emergency department; fall back to any
    // available doctor at the nearest hospital if none is listed —
    // real dispatch shouldn't fail just because of a department label.
    let candidateDoctors = await Doctor.find({
      hospital: nearestHospital._id,
      specialization: 'Emergency',
      availability: { $ne: 'on-leave' },
    });
    if (candidateDoctors.length === 0) {
      candidateDoctors = await Doctor.find({
        hospital: nearestHospital._id,
        availability: { $ne: 'on-leave' },
      });
    }

    let assignedDoctor = null;
    if (candidateDoctors.length > 0) {
      const loadCounts = await Appointment.aggregate([
        { $match: { doctor: { $in: candidateDoctors.map((d) => d._id) }, status: 'scheduled' } },
        { $group: { _id: '$doctor', count: { $sum: 1 } } },
      ]);
      const loadMap = new Map(loadCounts.map((l) => [String(l._id), l.count]));
      assignedDoctor = candidateDoctors.reduce((least, doc) => {
        const load = loadMap.get(String(doc._id)) || 0;
        const leastLoad = loadMap.get(String(least._id)) || 0;
        return load < leastLoad ? doc : least;
      }, candidateDoctors[0]);
    }

    const etaMinutes = estimateEtaMinutes(nearestDistance);
    const ambulanceId = generateAmbulanceId();

    // Create a real Appointment too — so this shows up in the
    // hospital's own Appointments tab and (if a doctor was found)
    // their assigned-patients list, not just as an isolated tracking
    // record only the patient can see. Second-level time precision
    // avoids collisions with the scheduled-visit uniqueness guard.
    let appointment = null;
    if (assignedDoctor) {
      const now = new Date();
      appointment = await Appointment.create({
        patient: patient._id,
        patientName: patient.fullName,
        hospital: nearestHospital._id,
        doctor: assignedDoctor._id,
        department: assignedDoctor.specialization,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 8),
        requiresBed: true,
        isEmergency: true,
      });
    }

    const emergencyRequest = await EmergencyRequest.create({
      patient: patient._id,
      patientName: patient.fullName,
      location: { lat, lng },
      hospital: nearestHospital._id,
      doctor: assignedDoctor?._id,
      ambulanceId,
      distanceKm: nearestDistance,
      etaMinutes,
    });

    res.status(201).json({
      requestId: emergencyRequest._id,
      hospitalName: nearestHospital.hospitalName,
      distanceKm: Number(nearestDistance.toFixed(1)),
      etaMinutes,
      ambulanceId,
      doctorName: assignedDoctor?.name || 'A doctor will be assigned on arrival',
      appointmentId: appointment?._id,
    });
  } catch (error) {
    console.error('Error dispatching emergency request:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Cancel a dispatch ----------
router.put('/:id/cancel', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    const request = await EmergencyRequest.findOne({ _id: req.params.id, patient: req.auth.id });
    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found.' });
    }
    request.status = 'cancelled';
    await request.save();
    res.json(request);
  } catch (error) {
    console.error('Error cancelling emergency request:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;