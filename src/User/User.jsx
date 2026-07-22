import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import api, { API_BASE_URL } from '../api/client';
import './User.css';

function StatusBadge({ status }) {
  return <span className={`user-appt-status user-appt-status-${status}`}>{status}</span>;
}

function RescheduleModal({ appointment, onClose, onRescheduled }) {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedTime('');
    api.get(`/hospitals/${appointment.hospital._id}/departments/${encodeURIComponent(appointment.department)}/slots`, { params: { date } })
      .then((res) => setSlots(res.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, appointment]);

  const handleConfirm = async () => {
    if (!selectedTime) {
      setError('Pick a time slot first.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await api.put(`/appointments/${appointment._id}/reschedule`, { date, time: selectedTime });
      onRescheduled(res.data.appointment);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reschedule this appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="reschedule-overlay open" onClick={onClose} />
      <div className="reschedule-modal open">
        <div className="reschedule-header">
          <h3>Reschedule Visit</h3>
          <button type="button" className="reschedule-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="reschedule-sub">
          {appointment.hospital?.hospitalName} · {appointment.department}
        </p>

        <label className="reschedule-date-label">
          New date
          <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        {date && (
          <div className="slot-grid-wrap">
            {loadingSlots && <p className="booking-panel-status">Loading times…</p>}
            {!loadingSlots && slots.length === 0 && (
              <p className="booking-panel-status">No doctors work this department on that date.</p>
            )}
            {slots.length > 0 && (
              <div className="slot-grid">
                {slots.map((s) => (
                  <button
                    type="button"
                    key={s.time}
                    className={`slot-btn ${selectedTime === s.time ? 'selected' : ''}`}
                    disabled={!s.available}
                    onClick={() => setSelectedTime(s.time)}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="booking-panel-status error">{error}</p>}

        <button type="button" className="btn-primary" onClick={handleConfirm} disabled={submitting || !selectedTime}>
          {submitting ? 'Saving…' : 'Confirm New Time'}
        </button>
      </div>
    </>
  );
}

function User() {
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [reschedulingAppt, setReschedulingAppt] = useState(null);

  useEffect(() => {
    api.get('/patient/profile')
      .then((res) => setProfile(res.data))
      .catch((err) => setProfileError(err.response?.data?.message || 'Could not load your profile.'))
      .finally(() => setLoadingProfile(false));

    api.get('/appointments/mine')
      .then((res) => setAppointments(res.data))
      .catch((err) => setAppointmentsError(err.response?.data?.message || 'Could not load your appointments.'))
      .finally(() => setLoadingAppointments(false));
  }, []);

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      const res = await api.put(`/appointments/${id}/cancel`);
      setAppointments((prev) => prev.map((a) => (a._id === id ? res.data : a)));
    } catch (err) {
      setAppointmentsError(err.response?.data?.message || 'Could not cancel this appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = appointments.filter((a) => a.status === 'scheduled');
  const past = appointments.filter((a) => a.status !== 'scheduled');

  const photoUrl = profile?.profilePhoto
    ? `${API_BASE_URL}/${profile.profilePhoto.replace(/\\/g, '/')}`
    : null;

  const renderAppointmentRow = (appt) => (
    <div className="appt-card" key={appt._id}>
      <div className="appt-card-main">
        <div className="appt-card-top">
          <span className="appt-hospital">{appt.hospital?.hospitalName || 'Hospital'}</span>
          <StatusBadge status={appt.status} />
        </div>
        <span className="appt-doctor">
          {appt.doctor?.name || 'Doctor TBD'} · {appt.department}
        </span>
        <span className="appt-meta">
          {appt.date} · {appt.time}
          {appt.requiresBed && ' · 🛏️ Bed held'}
          {appt.isEmergency && ' · 🚨 Urgent visit'}
        </span>
      </div>
      {appt.status === 'scheduled' && (
        <div className="appt-actions">
          {!appt.isEmergency && (
            <button
              type="button"
              className="appt-reschedule-btn"
              onClick={() => setReschedulingAppt(appt)}
            >
              Reschedule
            </button>
          )}
          <button
            type="button"
            className="appt-cancel-btn"
            onClick={() => handleCancel(appt._id)}
            disabled={cancellingId === appt._id}
          >
            {cancellingId === appt._id ? '…' : 'Cancel'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="user-page">
        <div className="user-layout">
          <div className="user-main">
            <div className="user-welcome">
              <div>
                <h1>Welcome, {profile?.fullName || 'there'}</h1>
                <p className="user-welcome-sub">Here's what's coming up for you.</p>
              </div>
              <Link to="/book-appointment" className="btn-primary-link">+ Book Appointment</Link>
            </div>

            <section className="user-section">
              <h2>Upcoming Appointments</h2>
              {loadingAppointments && <p className="user-status">Loading appointments…</p>}
              {appointmentsError && <p className="user-status error">{appointmentsError}</p>}
              {!loadingAppointments && upcoming.length === 0 && !appointmentsError && (
                <p className="user-status">No upcoming appointments. Book one to get started.</p>
              )}
              <div className="appt-list">
                {upcoming.map(renderAppointmentRow)}
              </div>
            </section>

            {past.length > 0 && (
              <section className="user-section">
                <h2>Past &amp; Cancelled</h2>
                <div className="appt-list">
                  {past.map(renderAppointmentRow)}
                </div>
              </section>
            )}
          </div>

          <aside className="user-sidebar">
            <div className="user-profile-card">
              <div className="user-avatar">
                {photoUrl ? (
                  <img src={photoUrl} alt={profile?.fullName || 'Profile'} />
                ) : (
                  <span>{(profile?.fullName || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>

              {loadingProfile && <p className="user-status">Loading profile…</p>}
              {profileError && <p className="user-status error">{profileError}</p>}

              {profile && !loadingProfile && (
                <dl className="user-profile-details">
                  <div>
                    <dt>Email</dt>
                    <dd>{profile.email || '—'}</dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>{profile.contactNumber || '—'}</dd>
                  </div>
                  <div>
                    <dt>Age</dt>
                    <dd>{profile.age || '—'}</dd>
                  </div>
                  <div>
                    <dt>Blood-relevant Info</dt>
                    <dd>{profile.allergies || 'No known allergies on file'}</dd>
                  </div>
                </dl>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

export default User;