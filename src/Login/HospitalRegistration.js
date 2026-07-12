import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import './LoginHospital.css';
import Navbar from '../Navbar/Navbar';

function HospitalRegistration() {
  const [form, setForm] = useState({
    hospitalName: '', loginId: '', city: '', address: '',
    password: '', confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/register/hospital', {
        hospitalName: form.hospitalName,
        loginId: form.loginId,
        city: form.city,
        address: form.address,
        password: form.password,
      });
      navigate('/login/hospital');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
            <Link to="/login/hospital" className="auth-tab">Login</Link>
            <span className="auth-tab active">Register</span>
          </div>

          <h2>Register Your Hospital</h2>
          <p className="auth-subtitle">Join the network and manage your hospital online.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label>
              Hospital Name
              <input
                type="text"
                name="hospitalName"
                placeholder="Sunrise General Hospital"
                value={form.hospitalName}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Login ID
              <input
                type="text"
                name="loginId"
                placeholder="Choose a unique ID"
                value={form.loginId}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </label>
            <label>
              City
              <input
                type="text"
                name="city"
                placeholder="Mumbai"
                value={form.city}
                onChange={handleChange}
              />
            </label>
            <label>
              Address
              <input
                type="text"
                name="address"
                placeholder="Street, area, pincode"
                value={form.address}
                onChange={handleChange}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? <span className="auth-spinner" aria-hidden="true" /> : 'Create Hospital Account'}
            </button>
          </form>

          <p className="auth-footnote">
            Already registered? <Link to="/login/hospital">Log in instead</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default HospitalRegistration;