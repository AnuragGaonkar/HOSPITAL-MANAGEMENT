import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from './adminApi';
import './Admin.css';

export default function AdminForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await adminApi.post('/forgot-password', { role: 'admin', email });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-shell admin-login-shell">
      <div className="admin-login-card">
        <div className="admin-login-badge">ADMIN</div>
        <h1>Reset Admin Password</h1>
        <p className="admin-login-sub">Enter the email on your admin account.</p>

        {result ? (
          <div>
            <p className="admin-login-sub">{result.message}</p>
            {result.devResetLink && (
              <>
                <p className="admin-login-sub">
                  <strong>Dev mode:</strong> no email service is connected yet, so here's
                  your reset link directly instead of it being emailed to you:
                </p>
                <Link to={result.devResetLink} className="admin-login-sub">
                  {window.location.origin}{result.devResetLink}
                </Link>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            {error && <p className="admin-error">{error}</p>}

            <button type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="admin-login-sub" style={{ marginTop: 20 }}>
          <Link to="/admin/login">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}