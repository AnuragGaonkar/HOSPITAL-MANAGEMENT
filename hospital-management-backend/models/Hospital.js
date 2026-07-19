const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  loginId: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  hospitalName: {
    type: String,
    required: true,
  },
  email: String, // used for password reset + contact
  state: String,
  city: String,
  address: String,
  pincode: String,

  bedsTotal: { type: Number, default: 0 },
  bedsAvailable: { type: Number, default: 0 },
  doctorsCount: { type: Number, default: 0 },
  departments: { type: [String], default: [] },
  photoUrl: String,

  // Password reset — token is hashed before storage, never stored raw.
  resetPasswordTokenHash: String,
  resetPasswordExpires: Date,

  // Approximate coordinates — used for the "nearest hospital" map
  // feature. Real hospitals should have this geocoded properly;
  // seeded/demo data uses randomized-but-plausible coordinates.
  location: {
    lat: Number,
    lng: Number,
  },

  // Not enforced yet — the admin verification/approval flow is a
  // separate feature to be built later. Defaults to 'approved' so
  // registration keeps working until that flow exists.
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Hospital', HospitalSchema);