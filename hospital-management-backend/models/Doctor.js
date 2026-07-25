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
  // normal (non-emergency) appointments. Each doctor can set their
  // own slot length now — the merge logic in utils/slots.js unions
  // every doctor's own times by string match, so differing slot
  // lengths across doctors in the same department coexist fine.
  workingHours: {
    start: { type: String, default: '09:00' }, // "HH:MM", 24hr
    end: { type: String, default: '17:00' },
    daysOff: { type: [Number], default: [0] }, // 0=Sunday ... 6=Saturday
    slotMinutes: { type: Number, default: 30 }, // this doctor's own appointment length
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Doctor', DoctorSchema);