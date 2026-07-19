import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import api from '../api/client';
import './LoginPatient.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') === 'hospital' ? 'hospital' : 'patient';
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
      await api.post('/reset-password', { role, token, password });
      setDone(true);
      setTimeout(() => navigate(role === 'hospital' ? '/login/hospital' : '/login/patient'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-card">
          <h2>Set a New Password</h2>
          <p className="auth-subtitle">
            {role === 'hospital' ? 'Resetting your hospital account password.' : 'Resetting your patient account password.'}
          </p>

          {done ? (
            <p className="auth-subtitle">Password updated — redirecting you to login…</p>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <label>
                New Password
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <label>
                Confirm Password
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </label>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-submit" disabled={submitting}>
                {submitting ? <span className="auth-spinner" aria-hidden="true" /> : 'Update Password'}
              </button>
            </form>
          )}

          <p className="auth-footnote">
            <Link to={role === 'hospital' ? '/login/hospital' : '/login/patient'}>← Back to login</Link>
          </p>
        </div>
      </div>
    </>
  );
}