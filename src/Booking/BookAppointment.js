const express = require('express');
const multer = require('multer');
const path = require('path');
const Hospital = require('../models/Hospital');
const InventoryItem = require('../models/InventoryItem');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { requireAuth, requireRole } = require('../middleware/auth');
const { computeBedsAvailable } = require('../utils/beds');

const router = express.Router();

router.use(requireAuth, requireRole('hospital'));

// Photo uploads (hospital's own photo, or a doctor's photo) land in
// uploads/photos/. Served back out via the existing static /uploads
// route in server.js, so a saved path like "uploads/photos/xyz.jpg"
// is reachable at {API_BASE_URL}/uploads/photos/xyz.jpg.
const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/photos/');
  },
  filename: function (req, file, cb) {
    const prefix = req.params.id || req.auth.id;
    const ext = path.extname(file.originalname);
    cb(null, `${prefix}-${Date.now()}${ext}`);
  },
});
const uploadPhoto = multer({ storage: photoStorage });

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

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
      bedsAvailable: await computeBedsAvailable(hospital),
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

router.get('/profile', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.auth.id)
      .select('hospitalName loginId email state city address pincode bedsTotal departments');
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }
    res.json({
      ...hospital.toObject(),
      bedsAvailable: await computeBedsAvailable(hospital),
    });
  } catch (error) {
    console.error('Error fetching hospital profile:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { hospitalName, email, state, city, address, pincode, bedsTotal, departments } = req.body;

    const hospital = await Hospital.findByIdAndUpdate(
      req.auth.id,
      {
        $set: {
          ...(hospitalName !== undefined && { hospitalName }),
          ...(email !== undefined && { email }),
          ...(state !== undefined && { state }),
          ...(city !== undefined && { city }),
          ...(address !== undefined && { address }),
          ...(pincode !== undefined && { pincode }),
          ...(bedsTotal !== undefined && { bedsTotal: Number(bedsTotal) }),
          ...(departments !== undefined && { departments }),
        },
      },
      { new: true, runValidators: true }
    ).select('hospitalName loginId email state city address pincode bedsTotal departments');

    res.json({
      ...hospital.toObject(),
      bedsAvailable: await computeBedsAvailable(hospital),
    });
  } catch (error) {
    console.error('Error updating hospital profile:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.put('/profile/photo', uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo was uploaded.' });
    }
    const hospital = await Hospital.findByIdAndUpdate(
      req.auth.id,
      { $set: { photoUrl: req.file.path.replace(/\\/g, '/') } },
      { new: true }
    ).select('photoUrl');
    res.json(hospital);
  } catch (error) {
    console.error('Error uploading hospital photo:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const filter = { hospital: req.auth.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const appointments = await Appointment.find(filter)
      .populate('doctor', 'name specialization')
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.put('/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, hospital: req.auth.id },
      { status },
      { new: true }
    ).populate('doctor', 'name specialization');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

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

router.post('/doctors', async (req, res) => {
  try {
    const { name, specialization, experienceYears, availability, contact, workingHours } = req.body;
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
      workingHours,
    });
    res.status(201).json(doctor);
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.put('/doctors/:id', async (req, res) => {
  try {
    const { name, specialization, experienceYears, availability, contact, workingHours } = req.body;
    const doctor = await Doctor.findOneAndUpdate(
      { _id: req.params.id, hospital: req.auth.id },
      { name, specialization, experienceYears, availability, contact, workingHours },
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

router.put('/doctors/:id/photo', uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo was uploaded.' });
    }
    const doctor = await Doctor.findOneAndUpdate(
      { _id: req.params.id, hospital: req.auth.id },
      { $set: { photoUrl: req.file.path.replace(/\\/g, '/') } },
      { new: true }
    );
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    res.json(doctor);
  } catch (error) {
    console.error('Error uploading doctor photo:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

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

router.put('/inventory/:id', async (req, res) => {
  try {
    const item = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, hospital: req.auth.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
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