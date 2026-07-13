const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  experienceYears: { type: Number, default: 1 },
  availability: {
    type: String,
    enum: ['available', 'on-leave', 'in-surgery'],
    default: 'available',
  },
  contact: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Doctor', DoctorSchema);