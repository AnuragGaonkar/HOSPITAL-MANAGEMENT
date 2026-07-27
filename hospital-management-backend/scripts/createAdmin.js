// One-time (or repeatable) way to create an admin account — run
// directly on the server, never exposed as an API route. This is the
// only way an Admin account can ever be created; there is no public
// registration endpoint for admins on purpose.
//
// Usage:
//   node scripts/createAdmin.js you@example.com yourPassword "Your Name"

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const SALT_ROUNDS = 10;

async function run() {
  const [, , email, password, name] = process.argv;

  if (!email || !password) {
    console.log('Usage: node scripts/createAdmin.js <email> <password> ["Name"]');
    process.exit(1);
  }
  if (password.length < 6) {
    console.log('Password must be at least 6 characters.');
    process.exit(1);
  }

  await connectDB();

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`An admin with email ${email} already exists.`);
    await mongoose.connection.close();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  await Admin.create({ email, password: hashedPassword, name: name || 'Admin' });

  console.log(`Admin account created for ${email}.`);
  console.log(`Log in at /admin/login with that email and password.`);

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to create admin:', err);
  process.exit(1);
});