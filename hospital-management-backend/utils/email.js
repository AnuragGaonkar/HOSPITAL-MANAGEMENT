const nodemailer = require('nodemailer');

// Reads SMTP credentials from environment variables. If they're not
// set, sendEmail() below just skips sending and returns false — the
// caller falls back to returning the link directly in the API
// response (dev-mode), so nothing breaks before you've set this up.
function getTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465, // true for port 465, false for 587
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

// Returns true if the email was actually sent, false if email isn't
// configured yet (caller should fall back to a dev-mode response).
async function sendPasswordResetEmail(to, resetUrl) {
  const transporter = getTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'Reset your Hospital Management System password',
    text: `Someone requested a password reset for this account. If this was you, reset your password here: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `
      <p>Someone requested a password reset for this account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });

  return true;
}

module.exports = { sendPasswordResetEmail };