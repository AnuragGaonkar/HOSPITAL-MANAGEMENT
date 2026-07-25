// Dumps a reference list of every hospital and doctor — with the exact
// filename each of their photos needs to be named — so you know what
// to name your AI-generated images before running importPhotos.js.
//
// Usage: node scripts/exportPhotoManifest.js
// Output: scripts/photo-manifest.json

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');

async function run() {
  await connectDB();

  const hospitals = await Hospital.find().select('loginId hospitalName photoUrl');
  const doctors = await Doctor.find().populate('hospital', 'hospitalName').select('name specialization hospital photoUrl');

  const manifest = {
    instructions: [
      'Hospitals: save each hospital photo as "<loginId>.jpg" (or .png) in uploads/import/hospitals/',
      'Doctors: save each doctor photo as "<doctorId>.jpg" (or .png) in uploads/import/doctors/',
      'Then run: node scripts/importPhotos.js',
    ],
    hospitals: hospitals.map((h) => ({
      loginId: h.loginId,
      name: h.hospitalName,
      expectedFilename: `${h.loginId}.jpg (or .png)`,
      alreadyHasPhoto: !!h.photoUrl,
    })),
    doctors: doctors.map((d) => ({
      doctorId: d._id.toString(),
      name: d.name,
      specialization: d.specialization,
      hospital: d.hospital?.hospitalName || '(unknown)',
      expectedFilename: `${d._id}.jpg (or .png)`,
      alreadyHasPhoto: !!d.photoUrl,
    })),
  };

  const outPath = path.join(__dirname, 'photo-manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));

  console.log(`Manifest written to ${outPath}`);
  console.log(`${hospitals.length} hospitals, ${doctors.length} doctors listed.`);
  console.log('Open that file to see exactly what filename each photo needs.');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to export manifest:', err);
  process.exit(1);
});