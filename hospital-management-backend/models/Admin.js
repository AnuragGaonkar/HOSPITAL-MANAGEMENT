const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const { requireAuth, requireRole } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');
const { sendHospitalVerificationEmail } = require('../utils/email');

const router = express.Router();

// ---------- Admin login ----------
// No corresponding /register route exists anywhere — see
// scripts/createAdmin.js for the only way an admin account gets made.
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, role: 'admin', name: admin.name || admin.email, id: admin._id });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Everything below requires a valid admin session.
router.use(requireAuth, requireRole('admin'));

// ---------- Overview stats ----------
router.get('/overview', async (req, res) => {
  try {
    const [pendingCount, approvedCount, rejectedCount, patientCount, appointmentCount] = await Promise.all([
      Hospital.countDocuments({ verificationStatus: 'pending' }),
      Hospital.countDocuments({ verificationStatus: 'approved' }),
      Hospital.countDocuments({ verificationStatus: 'rejected' }),
      Patient.countDocuments(),
      Appointment.countDocuments(),
    ]);
    res.json({ pendingCount, approvedCount, rejectedCount, patientCount, appointmentCount });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Hospitals, filterable by verification status ----------
router.get('/hospitals', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.verificationStatus = req.query.status;
    }
    const hospitals = await Hospital.find(filter)
      .select('hospitalName loginId email city state address verificationStatus createdAt')
      .sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Approve / reject a hospital ----------
router.put('/hospitals/:id/verify', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    ).select('hospitalName loginId email verificationStatus');
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    // Best-effort notification — doesn't block or fail the approval
    // itself if email isn't configured or the hospital never set a
    // contact email on their profile.
    let emailSent = false;
    if (hospital.email && (status === 'approved' || status === 'rejected')) {
      try {
        emailSent = await sendHospitalVerificationEmail(hospital.email, hospital.hospitalName, status);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError.message);
      }
    }

    res.json({ ...hospital.toObject(), emailSent });
  } catch (error) {
    console.error('Error updating hospital verification:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Patients (read-only oversight) ----------
router.get('/patients', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const filter = {};
    if (req.query.search) {
      const re = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [{ fullName: re }, { email: re }];
    }

    const [patients, total] = await Promise.all([
      Patient.find(filter)
        .select('fullName email contactNumber city createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Patient.countDocuments(filter),
    ]);

    res.json({ items: patients, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Appointments, system-wide (read-only oversight) ----------
router.get('/appointments', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.patientName = new RegExp(req.query.search.trim(), 'i');
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('hospital', 'hospitalName city')
        .populate('doctor', 'name specialization')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Appointment.countDocuments(filter),
    ]);

    res.json({ items: appointments, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;