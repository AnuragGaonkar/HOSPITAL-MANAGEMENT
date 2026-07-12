import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import './LoginHospital.css';
import Navbar from '../Navbar/Navbar';

function LoginHospital() {
  const [loginId, setLoginId] = useState('');
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
      const response = await api.post('/login/hospital', { loginId, password });
      login(response.data);
      const redirectTo = location.state?.from?.pathname || '/hospital/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
            <Link to="/register/hospital" className="auth-tab">Register</Link>
          </div>

          <h2>Login as Hospital</h2>
          <p className="auth-subtitle">Manage your hospital's dashboard and inventory.</p>

          <form onSubmit={handleLogin} noValidate>
            <label>
              Login ID
              <input
                type="text"
                placeholder="Your hospital login ID"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                autoComplete="username"
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
            New hospital? <Link to="/register/hospital">Register here</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default LoginHospital;