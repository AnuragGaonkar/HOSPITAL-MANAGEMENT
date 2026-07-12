// Seeds the Hospital collection with real Mumbai entries from
// hospital-data.json (bundled with this repo). Passwords from the
// source file are hashed before insert — never stored in plain text.
//
// Fields not present in the source data (doctorsCount, departments,
// bedsTotal, location) are synthetically generated for demo purposes —
// clearly marked below. Replace with real data as it becomes available.
//
// Usage:
//   node scripts/seedMumbaiHospitals.js            (seeds 25 hospitals)
//   node scripts/seedMumbaiHospitals.js --limit=50  (seeds up to 50)
//   node scripts/seedMumbaiHospitals.js --limit=all  (seeds all Mumbai entries)

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Hospital = require('../models/Hospital');

const SALT_ROUNDS = 10;

const DEPARTMENT_POOL = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics',
  'Gynecology', 'ENT', 'Dermatology', 'Neurology', 'Emergency',
  'Radiology', 'Oncology', 'Urology',
];

// Rough bounding box for Mumbai — used to generate plausible-looking
// demo coordinates since the source data has no lat/lng.
const MUMBAI_BOUNDS = { latMin: 18.89, latMax: 19.28, lngMin: 72.77, lngMax: 72.98 };

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCoord() {
  return {
    lat: Number((Math.random() * (MUMBAI_BOUNDS.latMax - MUMBAI_BOUNDS.latMin) + MUMBAI_BOUNDS.latMin).toFixed(6)),
    lng: Number((Math.random() * (MUMBAI_BOUNDS.lngMax - MUMBAI_BOUNDS.lngMin) + MUMBAI_BOUNDS.lngMin).toFixed(6)),
  };
}

function randomDepartments() {
  const shuffled = [...DEPARTMENT_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, randomInt(3, 6));
}

async function seed() {
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limitValue = limitArg ? limitArg.split('=')[1] : '25';

  const raw = fs.readFileSync(path.join(__dirname, '../hospital-data.json'), 'utf8');
  const allHospitals = JSON.parse(raw);

  let mumbaiHospitals = allHospitals.filter(
    (h) => (h.City || '').trim().toLowerCase() === 'mumbai'
  );

  if (limitValue !== 'all') {
    mumbaiHospitals = mumbaiHospitals.slice(0, Number(limitValue));
  }

  console.log(`Found ${mumbaiHospitals.length} Mumbai hospitals to seed.`);

  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const entry of mumbaiHospitals) {
    const loginId = entry['Login ID'];
    const bedsAvailable = Number(entry['Bed Availability']) || randomInt(10, 80);

    const existing = await Hospital.findOne({ loginId });
    if (existing) {
      skipped += 1;
      continue;
    }

    const hashedPassword = await bcrypt.hash(entry.Password || 'ChangeMe123', SALT_ROUNDS);

    await Hospital.create({
      loginId,
      password: hashedPassword,
      hospitalName: entry.Hospital,
      state: entry.State,
      city: entry.City,
      address: entry.LocalAddress,
      pincode: entry.Pincode ? String(entry.Pincode) : undefined,
      bedsAvailable,
      bedsTotal: bedsAvailable + randomInt(20, 150), // synthetic — no total-beds field in source data
      doctorsCount: randomInt(5, 40), // synthetic
      departments: randomDepartments(), // synthetic
      location: randomCoord(), // synthetic — approximate, not geocoded
    });

    created += 1;
    if (created <= 5) {
      console.log(`  sample login -> loginId: ${loginId}  password: ${entry.Password}`);
    }
  }

  console.log(`Seed complete: ${created} created, ${skipped} already existed.`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});