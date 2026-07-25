// Bulk-applies photos generated/downloaded outside the app.
//
// Setup:
//   1. Run `node scripts/exportPhotoManifest.js` first to see exactly
//      which filename each hospital/doctor expects.
//   2. Drop hospital photos into uploads/import/hospitals/, named
//      "<loginId>.jpg" (or .png) — e.g. "user3443.jpg"
//   3. Drop doctor photos into uploads/import/doctors/, named
//      "<doctorId>.jpg" (or .png) — e.g. "65f2a1b3c4d5e6f7a8b9c0d1.jpg"
//   4. Run: node scripts/importPhotos.js
//
// Matched photos are copied into uploads/photos/ (same place manual
// uploads through the UI go) and each record's photoUrl is updated.
// Already-uploaded photos are skipped unless you pass --overwrite.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');

const IMPORT_HOSPITALS_DIR = path.join(__dirname, '..', 'uploads', 'import', 'hospitals');
const IMPORT_DOCTORS_DIR = path.join(__dirname, '..', 'uploads', 'import', 'doctors');
const PHOTOS_DIR = path.join(__dirname, '..', 'uploads', 'photos');

const overwrite = process.argv.includes('--overwrite');

function findImageFile(dir, baseName) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const candidate = path.join(dir, baseName + ext);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function importForModel(Model, dir, matchField, label) {
  if (!fs.existsSync(dir)) {
    console.log(`No ${label} import folder found at ${dir} — skipping.`);
    return { matched: 0, skipped: 0 };
  }

  const records = await Model.find();
  let matched = 0;
  let skipped = 0;

  for (const record of records) {
    if (record.photoUrl && !overwrite) {
      continue; // already has a photo, leave it alone
    }

    const key = matchField === 'loginId' ? record.loginId : record._id.toString();
    const sourceFile = findImageFile(dir, key);
    if (!sourceFile) continue;

    const ext = path.extname(sourceFile);
    const destFilename = `${key}-${Date.now()}${ext}`;
    const destPath = path.join(PHOTOS_DIR, destFilename);

    fs.copyFileSync(sourceFile, destPath);
    record.photoUrl = `uploads/photos/${destFilename}`;
    await record.save();
    matched += 1;
  }

  skipped = records.length - matched;
  console.log(`${label}: ${matched} photos applied.`);
  return { matched, skipped };
}

async function run() {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  await connectDB();

  const hospitalResult = await importForModel(Hospital, IMPORT_HOSPITALS_DIR, 'loginId', 'Hospitals');
  const doctorResult = await importForModel(Doctor, IMPORT_DOCTORS_DIR, '_id', 'Doctors');

  console.log(`\nDone. ${hospitalResult.matched + doctorResult.matched} photos imported total.`);
  if (!overwrite) {
    console.log('Records that already had a photo were left untouched. Use --overwrite to replace them.');
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});