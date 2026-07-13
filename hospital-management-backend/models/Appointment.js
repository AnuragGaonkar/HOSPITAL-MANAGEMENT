const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true,
  },
  patientName: { type: String, required: true },

  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  department: { type: String, required: true },

  date: { type: String, required: true },
  time: { type: String, required: true },

  // Whether this appointment requires admission (occupies a bed).
  // When true, one bed is held on the hospital for the duration of
  // the appointment's active lifetime.
  requiresBed: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Appointment', AppointmentSchema);