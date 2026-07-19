import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import api from '../api/client';
import './LoginPatient.css';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'hospital' ? 'hospital' : 'patient';

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/forgot-password', { role, email });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${role === 'patient' ? 'active' : ''}`}
              onClick={() => setRole('patient')}
            >
              Patient
            </button>
            <button
              type="button"
              className={`auth-tab ${role === 'hospital' ? 'active' : ''}`}
              onClick={() => setRole('hospital')}
            >
              Hospital
            </button>
          </div>

          <h2>Reset Password</h2>
          <p className="auth-subtitle">
            {role === 'hospital'
              ? "Enter the contact email on your hospital's profile."
              : 'Enter the email you registered with.'}
          </p>

          {result ? (
            <div>
              <p className="auth-subtitle">{result.message}</p>
              {result.devResetLink && (
                <>
                  <p className="auth-subtitle">
                    <strong>Dev mode:</strong> no email service is connected yet, so here's
                    your reset link directly instead of it being emailed to you:
                  </p>
                  <Link to={result.devResetLink} className="auth-footnote">
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
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-submit" disabled={submitting}>
                {submitting ? <span className="auth-spinner" aria-hidden="true" /> : 'Send Reset Link'}
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