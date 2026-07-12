// Central place for the JWT secret so every route signs/verifies
// tokens the same way. Set a real JWT_SECRET env var in production —
// this fallback is only for local development.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const JWT_EXPIRES_IN = '7d';

module.exports = { JWT_SECRET, JWT_EXPIRES_IN };