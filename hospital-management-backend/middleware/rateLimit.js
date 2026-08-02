const rateLimit = require('express-rate-limit');

// Applied to login endpoints (patient, hospital, admin). Keyed by IP,
// so it limits brute-force attempts against any single account without
// needing to know which account is being targeted in advance.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in a few minutes.' },
});

// Stricter — forgot-password triggers an actual email send, so it's
// also worth throttling to stop it being used to spam someone's inbox.
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reset requests. Please try again later.' },
});

module.exports = { loginLimiter, forgotPasswordLimiter };