// Seeds a handful of realistic inventory items for every hospital
// currently in the database, so dashboards aren't empty after
// `npm run seed:mumbai`. Roughly a third of items are seeded below
// their reorder level on purpose, to demonstrate the low-stock alerts.
//
// Usage: node scripts/seedSampleInventory.js

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Hospital = require('../models/Hospital');
const InventoryItem = require('../models/InventoryItem');

const ITEM_POOL = [
  { name: 'Paracetamol 500mg (strip)', category: 'Medicine', unitPrice: 12 },
  { name: 'Amoxicillin 250mg (strip)', category: 'Medicine', unitPrice: 45 },
  { name: 'IV Saline 500ml', category: 'Consumable', unitPrice: 60 },
  { name: 'Surgical Gloves (box of 100)', category: 'Consumable', unitPrice: 350 },
  { name: 'N95 Masks (box of 20)', category: 'Consumable', unitPrice: 400 },
  { name: 'Syringes 5ml (box of 100)', category: 'Consumable', unitPrice: 220 },
  { name: 'Digital Thermometer', category: 'Equipment', unitPrice: 250 },
  { name: 'Pulse Oximeter', category: 'Equipment', unitPrice: 900 },
  { name: 'Blood Pressure Monitor', category: 'Equipment', unitPrice: 1800 },
  { name: 'Gauze Roll', category: 'Consumable', unitPrice: 30 },
  { name: 'Insulin Vials', category: 'Medicine', unitPrice: 150 },
  { name: 'Oxygen Cylinder (D-type)', category: 'Equipment', unitPrice: 3200 },
  { name: 'ORS Sachets (box of 50)', category: 'Medicine', unitPrice: 180 },
  { name: 'Wheelchair', category: 'Equipment', unitPrice: 4500 },
  { name: 'Antiseptic Solution 500ml', category: 'Consumable', unitPrice: 90 },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickItems(count) {
  const shuffled = [...ITEM_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function seed() {
  await connectDB();

  const hospitals = await Hospital.find();
  console.log(`Seeding sample inventory for ${hospitals.length} hospitals...`);

  let totalCreated = 0;

  for (const hospital of hospitals) {
    const existingCount = await InventoryItem.countDocuments({ hospital: hospital._id });
    if (existingCount > 0) {
      continue; // don't duplicate if this hospital already has items
    }

    const itemsToCreate = pickItems(randomInt(6, 9));

    for (const item of itemsToCreate) {
      const reorderLevel = randomInt(10, 40);
      const runLow = Math.random() < 0.3; // ~30% of items seeded as low stock
      const quantity = runLow
        ? randomInt(0, reorderLevel) // at/below reorder level
        : randomInt(reorderLevel + 10, reorderLevel + 200);

      await InventoryItem.create({
        hospital: hospital._id,
        itemName: item.name,
        itemCategory: item.category,
        itemDescription: '',
        sku: `SKU-${randomInt(1000, 9999)}`,
        stockInformation: {
          quantity,
          reorderLevel,
          unitPrice: item.unitPrice,
          batchDetails: [{
            batchNumber: `B${randomInt(100, 999)}`,
            manufactureDate: new Date(Date.now() - randomInt(30, 400) * 86400000),
            expiryDate: new Date(Date.now() + randomInt(60, 700) * 86400000),
          }],
        },
        supplierInformation: {
          supplierName: 'MedSupply Co.',
          supplierContact: '022-40000000',
          supplierEmail: 'orders@medsupply.example',
          supplierAddress: 'Mumbai, Maharashtra',
        },
        storageInformation: {
          storageLocation: 'Central Store, Room 2',
          storageConditions: 'Cool and dry place',
        },
        additionalInformation: {
          notes: 'Seeded demo data',
        },
      });
      totalCreated += 1;
    }
  }

  console.log(`Seed complete: ${totalCreated} inventory items created.`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});