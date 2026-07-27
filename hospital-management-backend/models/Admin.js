const mongoose = require('mongoose');

// There is deliberately no public registration route for this model —
// admin accounts are created only via scripts/createAdmin.js, run
// directly on the server. This keeps the admin portal from ever being
// reachable through a signup form.
const AdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Admin', AdminSchema);