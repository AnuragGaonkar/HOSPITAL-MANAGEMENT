import React, { useEffect, useState } from 'react';
import Navbar from '../Navbar/Navbar';
import api from '../api/client';
import './BookAppointment.css';

export default function BookAppointment() {
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({
    hospitalId: '', department: '', date: '', time: '', requiresBed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get('/hospitals')
      .then((res) => setHospitals(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load hospitals.'))
      .finally(() => setLoadingHospitals(false));
  }, []);

  const selectedHospital = hospitals.find((h) => h._id === form.hospitalId);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'hospitalId' ? { department: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/appointments', form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not book this appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setForm({ hospitalId: '', department: '', date: '', time: '', requiresBed: false });
  };

  return (
    <>
      <Navbar />
      <div className="booking-page">
        <div className="booking-card">
          <h1>Book an Appointment</h1>
          <p className="booking-subtitle">
            Find a hospital near you and we'll assign you a doctor automatically.
          </p>

          {loadError && <div className="booking-banner error">{loadError}</div>}

          {result ? (
            <div className="booking-success">
              <div className="booking-success-icon">✓</div>
              <h2>You're booked in</h2>
              <p>
                You've been assigned to <strong>{result.assignedDoctor.name}</strong>
                {' '}({result.assignedDoctor.specialization}) at <strong>{result.hospitalName}</strong> on{' '}
                <strong>{form.date}</strong> at <strong>{form.time}</strong>.
                {form.requiresBed && ' A bed has been held for you.'}
              </p>
              <button className="btn-primary" onClick={resetForm}>Book another</button>
            </div>
          ) : (
            <form className="booking-form" onSubmit={handleSubmit}>
              <label>
                Hospital
                <select
                  name="hospitalId"
                  value={form.hospitalId}
                  onChange={handleChange}
                  required
                  disabled={loadingHospitals}
                >
                  <option value="" disabled>
                    {loadingHospitals ? 'Loading hospitals…' : 'Select nearest hospital'}
                  </option>
                  {hospitals.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.hospitalName} — {h.city} ({h.bedsAvailable} beds free)
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Department
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                  disabled={!selectedHospital}
                >
                  <option value="" disabled>
                    {selectedHospital ? 'Select department' : 'Choose a hospital first'}
                  </option>
                  {selectedHospital?.departments?.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </label>

              <div className="booking-row">
                <label>
                  Date
                  <input type="date" name="date" value={form.date} onChange={handleChange} required />
                </label>
                <label>
                  Time
                  <input type="time" name="time" value={form.time} onChange={handleChange} required />
                </label>
              </div>

              <label className="booking-checkbox">
                <input
                  type="checkbox"
                  name="requiresBed"
                  checked={form.requiresBed}
                  onChange={handleChange}
                />
                This visit requires admission (holds a bed)
              </label>

              {error && <div className="booking-banner error">{error}</div>}

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Booking…' : 'Confirm Booking'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}