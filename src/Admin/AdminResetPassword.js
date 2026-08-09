import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import adminApi from './adminApi';
import './Admin.css';

export default function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('This reset link is missing its token — please request a new one.');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.post('/reset-password', { role: 'admin', token, password });
      setDone(true);
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-shell admin-login-shell">
      <div className="admin-login-card">
        <div className="admin-login-badge">ADMIN</div>
        <h1>Set a New Password</h1>

        {done ? (
          <p className="admin-login-sub">Password updated — redirecting you to login…</p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <label>
              New Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className="admin-error">{error}</p>}

            <button type="submit" disabled={submitting}>
              {submitting ? 'Updating…' : 'Update Password'}
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