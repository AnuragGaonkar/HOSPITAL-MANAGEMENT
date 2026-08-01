import React, { useCallback, useEffect, useState } from 'react';
import adminApi from './adminApi';
import { useAdminAuth } from './AdminAuthContext';
import './Admin.css';

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function HospitalsSection({ overview, setOverview }) {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState('');

  const loadHospitals = useCallback(() => {
    setLoading(true);
    setError('');
    adminApi.get('/admin/hospitals', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setHospitals(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load hospitals.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { loadHospitals(); }, [loadHospitals]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleVerify = async (id, status, hospitalName, hasEmail) => {
    setUpdatingId(id);
    try {
      const res = await adminApi.put(`/admin/hospitals/${id}/verify`, { status });
      setHospitals((prev) => prev.filter((h) => h._id !== id));
      setOverview((prev) => prev && ({
        ...prev,
        pendingCount: statusFilter === 'pending' ? prev.pendingCount - 1 : prev.pendingCount,
        approvedCount: status === 'approved' ? prev.approvedCount + 1 : prev.approvedCount,
        rejectedCount: status === 'rejected' ? prev.rejectedCount + 1 : prev.rejectedCount,
      }));

      if (!hasEmail) {
        setToast(`${hospitalName} ${status} — no contact email on file, so they weren't notified.`);
      } else if (res.data.emailSent) {
        setToast(`${hospitalName} ${status} — notification email sent.`);
      } else {
        setToast(`${hospitalName} ${status} — email not sent (SMTP not configured on the server).`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this hospital.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <h2>Hospital Verification Queue</h2>
      {toast && <div className="admin-toast">{toast}</div>}
      <div className="admin-filter-tabs">
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            className={statusFilter === s ? 'active' : ''}
            onClick={() => setStatusFilter(s)}
          >
            {s ? STATUS_LABEL[s] : 'All'}
          </button>
        ))}
      </div>

      {loading && <p className="admin-status">Loading hospitals…</p>}
      {error && <p className="admin-status error">{error}</p>}
      {!loading && hospitals.length === 0 && !error && (
        <p className="admin-status">No hospitals in this view.</p>
      )}

      {hospitals.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Login ID</th>
                <th>Location</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h) => (
                <tr key={h._id}>
                  <td>{h.hospitalName}</td>
                  <td>{h.loginId}</td>
                  <td>{h.city || '—'}{h.state ? `, ${h.state}` : ''}</td>
                  <td>{h.email || <span className="admin-no-email">none on file</span>}</td>
                  <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                  <td><span className={`admin-status-badge admin-status-${h.verificationStatus}`}>{h.verificationStatus}</span></td>
                  <td className="admin-row-actions">
                    {h.verificationStatus !== 'approved' && (
                      <button
                        type="button"
                        className="admin-approve-btn"
                        onClick={() => handleVerify(h._id, 'approved', h.hospitalName, !!h.email)}
                        disabled={updatingId === h._id}
                      >
                        Approve
                      </button>
                    )}
                    {h.verificationStatus !== 'rejected' && (
                      <button
                        type="button"
                        className="admin-reject-btn"
                        onClick={() => handleVerify(h._id, 'rejected', h.hospitalName, !!h.email)}
                        disabled={updatingId === h._id}
                      >
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function PatientsSection() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get('/admin/patients')
      .then((res) => setPatients(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load patients.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h2>Registered Patients</h2>
      {loading && <p className="admin-status">Loading patients…</p>}
      {error && <p className="admin-status error">{error}</p>}
      {!loading && patients.length === 0 && !error && (
        <p className="admin-status">No patients registered yet.</p>
      )}
      {patients.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>City</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id}>
                  <td>{p.fullName}</td>
                  <td>{p.email || '—'}</td>
                  <td>{p.contactNumber || '—'}</td>
                  <td>{p.city || '—'}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function AppointmentsSection() {
  const [statusFilter, setStatusFilter] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    adminApi.get('/admin/appointments', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setAppointments(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load appointments.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <>
      <h2>Appointments (most recent 200)</h2>
      <div className="admin-filter-tabs">
        {['', 'scheduled', 'completed', 'cancelled'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            className={statusFilter === s ? 'active' : ''}
            onClick={() => setStatusFilter(s)}
          >
            {s ? STATUS_LABEL[s] || s : 'All'}
          </button>
        ))}
      </div>

      {loading && <p className="admin-status">Loading appointments…</p>}
      {error && <p className="admin-status error">{error}</p>}
      {!loading && appointments.length === 0 && !error && (
        <p className="admin-status">No appointments in this view.</p>
      )}
      {appointments.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Hospital</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Date / Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id}>
                  <td>{a.patientName}{a.isEmergency && <span className="admin-emergency-tag"> 🚨</span>}</td>
                  <td>{a.hospital?.hospitalName || '—'}</td>
                  <td>{a.doctor?.name || '—'}</td>
                  <td>{a.department}</td>
                  <td>{a.date} · {a.time}</td>
                  <td><span className={`admin-status-badge admin-status-${a.status === 'scheduled' ? 'pending' : a.status === 'completed' ? 'approved' : 'rejected'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const [section, setSection] = useState('hospitals');

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  useEffect(() => {
    adminApi.get('/admin/overview')
      .then((res) => setOverview(res.data))
      .catch(() => {})
      .finally(() => setLoadingOverview(false));
  }, []);

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <span className="admin-topbar-badge">ADMIN</span>
          Hospital Management — Admin Portal
        </div>
        <div className="admin-topbar-user">
          <span>{admin?.name}</span>
          <button type="button" onClick={logout}>Log Out</button>
        </div>
      </header>

      <main className="admin-main">
        <h1>Overview</h1>
        {loadingOverview && <p className="admin-status">Loading…</p>}
        {overview && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card admin-stat-warning">
              <span className="admin-stat-number">{overview.pendingCount}</span>
              <span className="admin-stat-label">Pending hospitals</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">{overview.approvedCount}</span>
              <span className="admin-stat-label">Approved hospitals</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">{overview.rejectedCount}</span>
              <span className="admin-stat-label">Rejected hospitals</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">{overview.patientCount}</span>
              <span className="admin-stat-label">Registered patients</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">{overview.appointmentCount}</span>
              <span className="admin-stat-label">Total appointments</span>
            </div>
          </div>
        )}

        <div className="admin-section-tabs">
          {[
            ['hospitals', 'Hospitals'],
            ['patients', 'Patients'],
            ['appointments', 'Appointments'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={section === key ? 'active' : ''}
              onClick={() => setSection(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {section === 'hospitals' && <HospitalsSection overview={overview} setOverview={setOverview} />}
        {section === 'patients' && <PatientsSection />}
        {section === 'appointments' && <AppointmentsSection />}
      </main>
    </div>
  );
}