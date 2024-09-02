const mongoose = require('mongoose');

const InstituteSchema = new mongoose.Schema({
  'Login ID': {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  // Add any other fields relevant to the institute
}, {
  timestamps: true, // This adds createdAt and updatedAt fields automatically
});

const Institute = mongoose.model('Institute', InstituteSchema);

module.exports = Institute;
