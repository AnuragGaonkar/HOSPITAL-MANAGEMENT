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

  // Emergency/urgent bookings skip the normal slot grid entirely and
  // just get assigned to whoever's least busy right now — see
  // routes/booking.js. Kept on the record so hospitals can see which
  // bookings came in as walk-in emergencies vs scheduled visits.
  isEmergency: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },
}, {
  timestamps: true,
});

// Race-condition guard: even if two requests somehow pass the
// application-level slot check at the same instant, the database
// itself will reject the second insert for the same doctor at the
// same date+time (only while status is 'scheduled' — cancelled/
// completed appointments don't block that slot from being reused).
AppointmentSchema.index(
  { doctor: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: 'scheduled' } }
);

module.exports = mongoose.model('Appointment', AppointmentSchema);