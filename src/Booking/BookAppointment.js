import React, { useState } from 'react';
import './BookAppointment.css';

// Placeholder booking page — wire this up to a real
// GET /api/hospitals + POST /api/appointments flow once the backend
// exposes those endpoints. Kept intentionally simple for now so the
// "Book Appointment" link in the Navbar has somewhere real to go.
export default function BookAppointment() {
  const [form, setForm] = useState({ hospital: '', department: '', date: '', time: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="booking-page">
      <div className="booking-card">
        <h1>Book an Appointment</h1>
        <p className="booking-subtitle">
          Find a hospital near you and pick a slot that works for you.
        </p>

        {submitted ? (
          <div className="booking-success">
            <div className="booking-success-icon">✓</div>
            <h2>Request received</h2>
            <p>
              We've noted your request for <strong>{form.department || 'a consultation'}</strong> at{' '}
              <strong>{form.hospital || 'the selected hospital'}</strong> on{' '}
              <strong>{form.date || 'the selected date'}</strong>. A confirmation will follow shortly.
            </p>
            <button className="btn-primary" onClick={() => setSubmitted(false)}>
              Book another
            </button>
          </div>
        ) : (
          <form className="booking-form" onSubmit={handleSubmit}>
            <label>
              Hospital
              <select name="hospital" value={form.hospital} onChange={handleChange} required>
                <option value="" disabled>Select nearest hospital</option>
                <option>Sunrise General Hospital</option>
                <option>City Care Medical Center</option>
                <option>Lakeside Multispeciality Hospital</option>
              </select>
            </label>

            <label>
              Department
              <select name="department" value={form.department} onChange={handleChange} required>
                <option value="" disabled>Select department</option>
                <option>General Medicine</option>
                <option>Cardiology</option>
                <option>Orthopedics</option>
                <option>Pediatrics</option>
                <option>Dermatology</option>
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

            <button type="submit" className="btn-primary">Confirm Booking</button>
          </form>
        )}
      </div>
    </div>
  );
}