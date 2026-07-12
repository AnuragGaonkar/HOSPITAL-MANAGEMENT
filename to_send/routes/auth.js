const express = require('express');
const multer = require('multer');
const path = require('path');
const Patient = require('../models/Patient');
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const fullName = req.body.fullName.replace(/[^a-zA-Z0-9]/g, '-'); // Remove any special characters
    const fileExtension = path.extname(file.originalname);
    cb(null, `${fullName}-${Date.now()}${fileExtension}`);
  }
});

const upload = multer({ storage: storage });


// Registration route
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

    console.log('Received data:', req.body);
    console.log('Received file:', req.file);

    if (!aadhaarCardNumber || !password) {
      return res.status(400).json({ message: 'Required fields are missing.' });
    }

    const existingPatient = await Patient.findOne({ aadhaarCardNumber });
    if (existingPatient) {
      return res.status(400).json({ message: 'Aadhaar card number already registered.' });
    }

    const newPatient = new Patient({
      fullName, dob, age, gender, weight, height, contactNumber,
      email, address, emergencyContactName, emergencyContactRelation,
      emergencyContactNumber, allergies, medications, pastSurgeries,
      chronicConditions, familyHistory, insuranceProvider, policyNumber,
      groupNumber, insuranceContact, preferredDoctor, reasonForRegistration,
      additionalComments, aadhaarCardNumber, password,
      profilePhoto: req.file ? req.file.path : undefined,
    });

    await newPatient.save();
    res.status(201).json({ message: 'Patient registered successfully!' });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Login route
router.post('/login/patient', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find patient by email
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    // Validate password (replace this with proper hashing comparison)
    if (patient.password !== password) {
      return res.status(400).json({ message: 'Invalid password.' });
    }

    // Generate and send token (replace with actual token generation logic)
    const token = 'dummy-token'; // Replace this with actual JWT or other token
    res.status(200).json({ token, fullName: patient.fullName });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.post('/login/institute', async (req, res) => {
  const { instituteId, password } = req.body;

  try {
    // Find institute by Login ID
    const institute = await Institute.findOne({ 'Login ID': instituteId });

    if (!institute) {
      return res.status(400).json({ message: 'Institute not found' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, institute.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: institute._id }, 'your_jwt_secret', {
      expiresIn: '1h',
    });

    res.json({ token, name: institute.loginId });
  } catch (error) {
    console.error('Error during institute login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
