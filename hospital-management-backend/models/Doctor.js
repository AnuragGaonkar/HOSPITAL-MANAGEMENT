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
  photoUrl: String,

  // Per-doctor working hours, used to generate bookable slots for
  // normal (non-emergency) appointments. Slot length is fixed
  // app-wide at 30 minutes (see utils/slots.js) so that multiple
  // doctors' schedules can be merged into one shared time grid for
  // patients — only start/end/daysOff vary per doctor.
  workingHours: {
    start: { type: String, default: '09:00' }, // "HH:MM", 24hr
    end: { type: String, default: '17:00' },
    daysOff: { type: [Number], default: [0] }, // 0=Sunday ... 6=Saturday
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Doctor', DoctorSchema);