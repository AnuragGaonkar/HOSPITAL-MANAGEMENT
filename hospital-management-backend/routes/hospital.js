const express = require('express');
const Hospital = require('../models/Hospital');
const InventoryItem = require('../models/InventoryItem');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes here require a valid hospital login
router.use(requireAuth, requireRole('hospital'));

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ---------- Overview stats for the dashboard ----------
router.get('/overview', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.auth.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    const lowStockFilter = {
      hospital: hospital._id,
      $expr: { $lte: ['$stockInformation.quantity', '$stockInformation.reorderLevel'] },
    };
    const lowStockCount = await InventoryItem.countDocuments(lowStockFilter);
    const lowStockItems = await InventoryItem.find(lowStockFilter)
      .select('itemName stockInformation.quantity stockInformation.reorderLevel')
      .sort({ 'stockInformation.quantity': 1 })
      .limit(5);

    const realDoctorsCount = await Doctor.countDocuments({ hospital: hospital._id });

    const todaysAppointments = await Appointment.countDocuments({
      hospital: hospital._id,
      status: 'scheduled',
      createdAt: { $gte: startOfToday() },
    });

    // Per-department doctor counts + how many of them are currently available.
    const departmentBreakdown = await Doctor.aggregate([
      { $match: { hospital: hospital._id } },
      {
        $group: {
          _id: '$specialization',
          doctorCount: { $sum: 1 },
          availableCount: {
            $sum: { $cond: [{ $eq: ['$availability', 'available'] }, 1, 0] },
          },
        },
      },
      { $project: { _id: 0, department: '$_id', doctorCount: 1, availableCount: 1 } },
      { $sort: { department: 1 } },
    ]);

    res.json({
      hospitalName: hospital.hospitalName,
      city: hospital.city,
      address: hospital.address,
      bedsTotal: hospital.bedsTotal,
      bedsAvailable: hospital.bedsAvailable,
      doctorsCount: realDoctorsCount > 0 ? realDoctorsCount : hospital.doctorsCount,
      departments: hospital.departments,
      departmentBreakdown,
      lowStockCount,
      lowStockItems: lowStockItems.map((i) => ({
        itemName: i.itemName,
        quantity: i.stockInformation.quantity,
        reorderLevel: i.stockInformation.reorderLevel,
      })),
      todaysAppointments,
    });
  } catch (error) {
    console.error('Error fetching hospital overview:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Doctors ----------
// Optional ?department=Cardiology to filter the list.
// Each doctor includes real assigned-patient data (name + count) pulled
// from actual Appointment records — not a random number.
router.get('/doctors', async (req, res) => {
  try {
    const filter = { hospital: req.auth.id };
    if (req.query.department) {
      filter.specialization = req.query.department;
    }
    const doctors = await Doctor.find(filter).sort({ name: 1 }).lean();

    const doctorIds = doctors.map((d) => d._id);
    const appointments = await Appointment.find({
      doctor: { $in: doctorIds },
      status: 'scheduled',
    }).select('doctor patientName date time requiresBed');

    const patientsByDoctor = new Map();
    appointments.forEach((appt) => {
      const key = String(appt.doctor);
      if (!patientsByDoctor.has(key)) patientsByDoctor.set(key, []);
      patientsByDoctor.get(key).push({
        patientName: appt.patientName,
        date: appt.date,
        time: appt.time,
        requiresBed: appt.requiresBed,
      });
    });

    const withPatients = doctors.map((doc) => ({
      ...doc,
      assignedPatients: patientsByDoctor.get(String(doc._id)) || [],
    }));

    res.json(withPatients);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Add a doctor ----------
router.post('/doctors', async (req, res) => {
  try {
    const { name, specialization, experienceYears, availability, contact } = req.body;
    if (!name || !specialization) {
      return res.status(400).json({ message: 'Name and specialization are required.' });
    }
    const doctor = await Doctor.create({
      hospital: req.auth.id,
      name,
      specialization,
      experienceYears: experienceYears || 1,
      availability: availability || 'available',
      contact,
    });
    res.status(201).json(doctor);
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Edit a doctor ----------
router.put('/doctors/:id', async (req, res) => {
  try {
    const { name, specialization, experienceYears, availability, contact } = req.body;
    const doctor = await Doctor.findOneAndUpdate(
      { _id: req.params.id, hospital: req.auth.id },
      { name, specialization, experienceYears, availability, contact },
      { new: true, runValidators: true }
    );
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    res.json(doctor);
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Remove a doctor ----------
router.delete('/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndDelete({ _id: req.params.id, hospital: req.auth.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    res.json({ message: 'Doctor removed.' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Inventory ----------
router.get('/inventory', async (req, res) => {
  try {
    const items = await InventoryItem.find({ hospital: req.auth.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.post('/inventory', async (req, res) => {
  try {
    const item = new InventoryItem({ ...req.body, hospital: req.auth.id });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.delete('/inventory/:id', async (req, res) => {
  try {
    const item = await InventoryItem.findOneAndDelete({ _id: req.params.id, hospital: req.auth.id });
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    res.json({ message: 'Item deleted.' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;