const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');

const router = express.Router();

const SALT_ROUNDS = 10;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const fullName = (req.body.fullName || 'patient').replace(/[^a-zA-Z0-9]/g, '-');
    const fileExtension = path.extname(file.originalname);
    cb(null, `${fullName}-${Date.now()}${fileExtension}`);
  }
});

const upload = multer({ storage: storage });

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ---------- Patient registration ----------
router.post('/register/patient', upload.single('profilePhoto'), async (req, res) => {
  try {
    const {
      fullName, dob, age, gender, weight, height, contactNumber,
      email, address, emergencyContactName, emergencyContactRelation,
      emergencyContactNumber, allergies, medications, pastSurgeries,
      chronicConditions, familyHistory, insuranceProvider, policyNumber,
      groupNumber, insuranceContact, preferredDoctor, reasonForRegistration,
      additionalComments, aadhaarCardNumber, password
    } = req.body;

    if (!aadhaarCardNumber || !password) {
      return res.status(400).json({ message: 'Required fields are missing.' });
    }

    const existingPatient = await Patient.findOne({ aadhaarCardNumber });
    if (existingPatient) {
      return res.status(400).json({ message: 'Aadhaar card number already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newPatient = new Patient({
      fullName, dob, age, gender, weight, height, contactNumber,
      email, address, emergencyContactName, emergencyContactRelation,
      emergencyContactNumber, allergies, medications, pastSurgeries,
      chronicConditions, familyHistory, insuranceProvider, policyNumber,
      groupNumber, insuranceContact, preferredDoctor, reasonForRegistration,
      additionalComments, aadhaarCardNumber, password: hashedPassword,
      profilePhoto: req.file ? req.file.path : undefined,
    });

    await newPatient.save();
    res.status(201).json({ message: 'Patient registered successfully!' });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Patient login ----------
router.post('/login/patient', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(404).json({ message: 'No account found with that email.' });
    }

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password.' });
    }

    const token = signToken({ id: patient._id, role: 'patient' });
    res.status(200).json({
      token,
      role: 'patient',
      fullName: patient.fullName,
      id: patient._id,
    });
  } catch (error) {
    console.error('Error during patient login:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Hospital registration ----------
// NOTE: admin verification/approval is a separate feature to be built
// later — Hospital.verificationStatus defaults to 'approved' for now
// so this flow keeps working until that's in place.
router.post('/register/hospital', async (req, res) => {
  try {
    const { loginId, hospitalName, password, city, state, address, pincode } = req.body;

    if (!loginId || !password || !hospitalName) {
      return res.status(400).json({ message: 'Hospital name, login ID, and password are required.' });
    }

    const existing = await Hospital.findOne({ loginId });
    if (existing) {
      return res.status(400).json({ message: 'That login ID is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const hospital = new Hospital({
      loginId,
      hospitalName,
      password: hashedPassword,
      city,
      state,
      address,
      pincode,
    });

    await hospital.save();
    res.status(201).json({ message: 'Hospital registered successfully!' });
  } catch (error) {
    console.error('Error registering hospital:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Hospital login ----------
router.post('/login/hospital', async (req, res) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ message: 'Login ID and password are required.' });
    }

    const hospital = await Hospital.findOne({ loginId });
    if (!hospital) {
      return res.status(400).json({ message: 'Hospital not found.' });
    }

    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = signToken({ id: hospital._id, role: 'hospital' });
    res.json({
      token,
      role: 'hospital',
      name: hospital.hospitalName,
      id: hospital._id,
    });
  } catch (error) {
    console.error('Error during hospital login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;