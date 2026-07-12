const express = require('express');
const Hospital = require('../models/Hospital');
const InventoryItem = require('../models/InventoryItem');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes here require a valid hospital login
router.use(requireAuth, requireRole('hospital'));

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

    res.json({
      hospitalName: hospital.hospitalName,
      city: hospital.city,
      address: hospital.address,
      bedsTotal: hospital.bedsTotal,
      bedsAvailable: hospital.bedsAvailable,
      doctorsCount: hospital.doctorsCount,
      departments: hospital.departments,
      lowStockCount,
      lowStockItems: lowStockItems.map((i) => ({
        itemName: i.itemName,
        quantity: i.stockInformation.quantity,
        reorderLevel: i.stockInformation.reorderLevel,
      })),
      // Appointments aren't built yet — kept at 0 until that feature
      // exists, so the dashboard can display the stat without lying.
      todaysAppointments: 0,
    });
  } catch (error) {
    console.error('Error fetching hospital overview:', error);
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