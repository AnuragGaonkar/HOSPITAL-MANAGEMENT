// Seeds randomized doctors for every hospital, using each hospital's
// own `doctorsCount` and `departments` so the numbers stay consistent
// with what the dashboard already shows.
//
// Usage: node scripts/seedDoctors.js

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna',
  'Ishaan', 'Rohan', 'Ananya', 'Diya', 'Priya', 'Isha', 'Kavya', 'Anika',
  'Meera', 'Neha', 'Riya', 'Sanya',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Iyer', 'Nair', 'Reddy', 'Gupta', 'Kulkarni', 'Joshi',
  'Menon', 'Rao', 'Patil', 'Desai', 'Shah', 'Kapoor', 'Chatterjee',
];

const FALLBACK_SPECIALIZATIONS = ['General Medicine', 'Emergency'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomName() {
  const first = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];
  const last = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];
  return `Dr. ${first} ${last}`;
}

function randomAvailability() {
  const roll = Math.random();
  if (roll < 0.7) return 'available';
  if (roll < 0.9) return 'on-leave';
  return 'in-surgery';
}

async function seed() {
  await connectDB();

  const hospitals = await Hospital.find();
  console.log(`Seeding doctors for ${hospitals.length} hospitals...`);

  let totalCreated = 0;

  for (const hospital of hospitals) {
    const existingCount = await Doctor.countDocuments({ hospital: hospital._id });
    if (existingCount > 0) {
      continue; // don't duplicate if this hospital already has doctors
    }

    const specializationPool = hospital.departments?.length
      ? hospital.departments
      : FALLBACK_SPECIALIZATIONS;

    const count = hospital.doctorsCount > 0 ? hospital.doctorsCount : randomInt(5, 15);

    const doctors = Array.from({ length: count }, () => ({
      hospital: hospital._id,
      name: randomName(),
      specialization: specializationPool[randomInt(0, specializationPool.length - 1)],
      experienceYears: randomInt(1, 30),
      availability: randomAvailability(),
      contact: `+91 ${randomInt(70000, 99999)}${randomInt(10000, 99999)}`,
    }));

    await Doctor.insertMany(doctors);
    totalCreated += doctors.length;
  }

  console.log(`Seed complete: ${totalCreated} doctors created.`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});