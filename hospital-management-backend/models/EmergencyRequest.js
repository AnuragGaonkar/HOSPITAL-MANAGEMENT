const mongoose = require('mongoose');

const EmergencyRequestSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true,
  },
  patientName: { type: String, required: true },

  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },

  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },

  ambulanceId: { type: String, required: true },
  distanceKm: Number,
  etaMinutes: Number,

  status: {
    type: String,
    enum: ['dispatched', 'arrived', 'completed', 'cancelled'],
    default: 'dispatched',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('EmergencyRequest', EmergencyRequestSchema);