import React, { useCallback, useEffect, useState } from 'react';
import adminApi from './adminApi';
import { useAdminAuth } from './AdminAuthContext';
import './Admin.css';

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [statusFilter, setStatusFilter] = useState('pending');
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    adminApi.get('/admin/overview')
      .then((res) => setOverview(res.data))
      .catch(() => {})
      .finally(() => setLoadingOverview(false));
  }, []);

  const loadHospitals = useCallback(() => {
    setLoadingHospitals(true);
    setError('');
    adminApi.get('/admin/hospitals', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setHospitals(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load hospitals.'))
      .finally(() => setLoadingHospitals(false));
  }, [statusFilter]);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  const handleVerify = async (id, status) => {
    setUpdatingId(id);
    try {
      await adminApi.put(`/admin/hospitals/${id}/verify`, { status });
      setHospitals((prev) => prev.filter((h) => h._id !== id));
      setOverview((prev) => prev && ({
        ...prev,
        pendingCount: statusFilter === 'pending' ? prev.pendingCount - 1 : prev.pendingCount,
        approvedCount: status === 'approved' ? prev.approvedCount + 1 : prev.approvedCount,
        rejectedCount: status === 'rejected' ? prev.rejectedCount + 1 : prev.rejectedCount,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this hospital.');
    } finally {
      setUpdatingId(null);
    }
  };

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

        <h2>Hospital Verification Queue</h2>
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

        {loadingHospitals && <p className="admin-status">Loading hospitals…</p>}
        {error && <p className="admin-status error">{error}</p>}
        {!loadingHospitals && hospitals.length === 0 && !error && (
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
                    <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                    <td><span className={`admin-status-badge admin-status-${h.verificationStatus}`}>{h.verificationStatus}</span></td>
                    <td className="admin-row-actions">
                      {h.verificationStatus !== 'approved' && (
                        <button
                          type="button"
                          className="admin-approve-btn"
                          onClick={() => handleVerify(h._id, 'approved')}
                          disabled={updatingId === h._id}
                        >
                          Approve
                        </button>
                      )}
                      {h.verificationStatus !== 'rejected' && (
                        <button
                          type="button"
                          className="admin-reject-btn"
                          onClick={() => handleVerify(h._id, 'rejected')}
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
      </main>
    </div>
  );
}