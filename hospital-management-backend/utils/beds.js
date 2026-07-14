const Appointment = require('../models/Appointment');

// Beds "available" is always computed from real, currently-active
// bed-holding appointments — never stored/mutated as an independent
// counter. This is the single source of truth so the number can't
// drift out of sync with what a hospital edits on its profile page.
async function computeBedsAvailable(hospital) {
  const occupied = await Appointment.countDocuments({
    hospital: hospital._id,
    requiresBed: true,
    status: 'scheduled',
  });
  return Math.max(hospital.bedsTotal - occupied, 0);
}

module.exports = { computeBedsAvailable };