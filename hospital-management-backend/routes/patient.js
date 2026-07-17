const express = require('express');
const Patient = require('../models/Patient');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('patient'));

// ---------- Patient's own profile ----------
router.get('/profile', async (req, res) => {
  try {
    const patient = await Patient.findById(req.auth.id).select('-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Editable subset only — aadhaarCardNumber (identity document) and
// password (separate flow) are intentionally not editable here.
const EDITABLE_FIELDS = [
  'fullName', 'email', 'contactNumber', 'address', 'weight', 'height',
  'emergencyContactName', 'emergencyContactRelation', 'emergencyContactNumber',
  'allergies', 'medications', 'pastSurgeries', 'chronicConditions', 'familyHistory',
  'insuranceProvider', 'policyNumber', 'groupNumber', 'insuranceContact',
  'preferredDoctor', 'additionalComments',
];

router.put('/profile', async (req, res) => {
  try {
    const updates = {};
    EDITABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const patient = await Patient.findByIdAndUpdate(
      req.auth.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }
    res.json(patient);
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;