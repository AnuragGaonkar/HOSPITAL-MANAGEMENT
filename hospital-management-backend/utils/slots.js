// Default slot length, used only as a fallback for doctors that
// predate the per-doctor slotMinutes field. Each doctor can now set
// their own — the merge logic in routes/booking.js unions every
// doctor's own generated times by string match, so differing slot
// lengths across doctors in the same department coexist fine (they
// just don't line up on the same grid ticks, which is fine since the
// patient never books a specific doctor directly).
const SLOT_MINUTES = 30;

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Day-of-week for a "YYYY-MM-DD" string, using local interpretation
// (not UTC) to match what the patient actually picked on their
// calendar input.
function dayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=Sunday ... 6=Saturday
}

// All slot start-times (e.g. "09:00", "09:30", ...) a single doctor
// could theoretically work on the given date, ignoring what's already
// booked. Empty array if it's one of their days off.
function generateDoctorSlots(doctor, dateStr) {
  const daysOff = doctor.workingHours?.daysOff ?? [0];
  if (daysOff.includes(dayOfWeek(dateStr))) return [];

  const start = timeToMinutes(doctor.workingHours?.start || '09:00');
  const end = timeToMinutes(doctor.workingHours?.end || '17:00');
  const slotMinutes = doctor.workingHours?.slotMinutes || SLOT_MINUTES;

  const slots = [];
  for (let t = start; t + slotMinutes <= end; t += slotMinutes) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

module.exports = { SLOT_MINUTES, generateDoctorSlots, timeToMinutes, minutesToTime, dayOfWeek };