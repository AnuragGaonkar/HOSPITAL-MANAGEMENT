const express = require('express');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');

const router = express.Router();

// No auth required — this powers the public Home page, which anyone
// (logged in or not) can see. Only aggregate counts, nothing
// per-hospital or identifying.
router.get('/stats', async (req, res) => {
  try {
    const [hospitalCount, doctorCount, cities] = await Promise.all([
      Hospital.countDocuments(),
      Doctor.countDocuments(),
      Hospital.distinct('city'),
    ]);
    res.json({
      hospitalCount,
      doctorCount,
      cityCount: cities.filter(Boolean).length,
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;