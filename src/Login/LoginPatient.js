import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import './LoginPatient.css';
import Navbar from '../Navbar/Navbar';

function LoginPatient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await api.post('/login/patient', { email, password });
      login(response.data);
      const redirectTo = location.state?.from?.pathname || '/user';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
            <span className="auth-tab active">Login</span>
            <Link to="/register/patient" className="auth-tab">Register</Link>
          </div>

          <h2>Login as Patient</h2>
          <p className="auth-subtitle">Access your appointments and medical records.</p>

          <form onSubmit={handleLogin} noValidate>
            <label>
              Email
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? <span className="auth-spinner" aria-hidden="true" /> : 'Login'}
            </button>
          </form>

          <p className="auth-footnote">
            New here? <Link to="/register/patient">Create a patient account</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default LoginPatient;