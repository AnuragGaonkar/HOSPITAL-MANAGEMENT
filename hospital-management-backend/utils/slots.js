// Fixed app-wide slot length. Kept as a constant (not per-doctor) so
// that multiple doctors' individual schedules can be merged into one
// shared time grid a patient picks from — only each doctor's
// start/end/daysOff vary.
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

  const slots = [];
  for (let t = start; t + SLOT_MINUTES <= end; t += SLOT_MINUTES) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

module.exports = { SLOT_MINUTES, generateDoctorSlots, timeToMinutes, minutesToTime, dayOfWeek };