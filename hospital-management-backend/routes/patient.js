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

module.exports = router;