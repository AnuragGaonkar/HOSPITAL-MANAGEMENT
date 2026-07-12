const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

// Verifies the Bearer token on protected routes and attaches the
// decoded payload ({ id, role }) to req.auth.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// Use after requireAuth to restrict a route to a specific role,
// e.g. requireRole('hospital')
function requireRole(role) {
  return (req, res, next) => {
    if (!req.auth || req.auth.role !== role) {
      return res.status(403).json({ message: 'Not authorized for this resource.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };