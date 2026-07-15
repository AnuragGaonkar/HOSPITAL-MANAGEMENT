import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import api, { API_BASE_URL } from '../api/client';
import './User.css';

function StatusBadge({ status }) {
  return <span className={`user-appt-status user-appt-status-${status}`}>{status}</span>;
}

function User() {
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

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
        </span>
      </div>
      {appt.status === 'scheduled' && (
        <button
          type="button"
          className="appt-cancel-btn"
          onClick={() => handleCancel(appt._id)}
          disabled={cancellingId === appt._id}
        >
          {cancellingId === appt._id ? '…' : 'Cancel'}
        </button>
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