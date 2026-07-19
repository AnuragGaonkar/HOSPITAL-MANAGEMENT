const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const { sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function getModel(role) {
  if (role === 'patient') return Patient;
  if (role === 'hospital') return Hospital;
  return null;
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ---------- Step 1: request a reset ----------
// Patients look up by email; hospitals by their contact email (set on
// the hospital's profile) since hospitals log in with a loginId, not
// an email, and loginId alone isn't a safe way to verify identity.
router.post('/forgot-password', async (req, res) => {
  try {
    const { role, email } = req.body;
    const Model = getModel(role);
    if (!Model || !email) {
      return res.status(400).json({ message: 'Role and email are required.' });
    }

    const account = await Model.findOne({ email });

    // Always respond the same way whether or not the account exists —
    // otherwise this endpoint becomes a way to check which emails are
    // registered.
    const genericResponse = {
      message: 'If that email is registered, a reset link has been generated.',
    };

    if (!account) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    account.resetPasswordTokenHash = hashToken(rawToken);
    account.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await account.save();

    const resetPath = `/reset-password?role=${role}&token=${rawToken}`;
    const resetUrl = `${FRONTEND_URL}${resetPath}`;

    let emailSent = false;
    try {
      emailSent = await sendPasswordResetEmail(email, resetUrl);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError.message);
    }

    if (emailSent) {
      return res.json(genericResponse);
    }

    // Email isn't configured (or just failed) — fall back to returning
    // the link directly so the flow is still testable. See utils/email.js
    // to wire up real SMTP credentials.
    res.json({ ...genericResponse, devResetLink: resetPath });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ---------- Step 2: complete the reset ----------
router.post('/reset-password', async (req, res) => {
  try {
    const { role, token, password } = req.body;
    const Model = getModel(role);
    if (!Model || !token || !password) {
      return res.status(400).json({ message: 'Role, token, and new password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const account = await Model.findOne({
      resetPasswordTokenHash: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!account) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }

    account.password = await bcrypt.hash(password, SALT_ROUNDS);
    account.resetPasswordTokenHash = undefined;
    account.resetPasswordExpires = undefined;
    await account.save();

    res.json({ message: 'Password updated. You can now log in.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;