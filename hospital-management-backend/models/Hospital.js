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

  // Enforced now that the admin portal exists — new registrations
  // start pending and can't log in until an admin approves them (see
  // /login/hospital in routes/auth.js). Existing hospitals already in
  // the database keep whatever status they were saved with; this
  // default only applies going forward.
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Hospital', HospitalSchema);