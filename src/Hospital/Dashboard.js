import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import DoctorsPanel from './DoctorsPanel';
import api from '../api/client';
import './Dashboard.css';

function StatCard({ icon, label, value, hint, variant, delay, onClick }) {
  const clickable = !!onClick;
  return (
    <div
      className={`stat-card ${variant ? `stat-card-${variant}` : ''} ${clickable ? 'stat-card-clickable' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <span className="stat-icon" aria-hidden="true">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {hint && <span className="stat-hint">{hint}</span>}
      {clickable && <span className="stat-card-arrow" aria-hidden="true">→</span>}
    </div>
  );
}

function BedsCard({ bedsAvailable, bedsTotal, delay }) {
  const pct = bedsTotal > 0 ? Math.round((bedsAvailable / bedsTotal) * 100) : 0;
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
      <span className="stat-icon" aria-hidden="true">🛏️</span>
      <span className="stat-value">{bedsAvailable} <span className="stat-value-of">/ {bedsTotal}</span></span>
      <span className="stat-label">Beds Available</span>
      <div className="stat-progress-track">
        <div className="stat-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="stat-hint">{pct}% free right now</span>
    </div>
  );
}

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const TABS = ['overview', 'inventory', 'appointments'];
  const activeTab = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview';
  const activeTabIndex = TABS.indexOf(activeTab);

  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState('');
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [items, setItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: 0, reorderLevel: 0, unitPrice: 0 });
  const [savingItemId, setSavingItemId] = useState(null);
  const [inventorySearch, setInventorySearch] = useState('');

  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [updatingApptId, setUpdatingApptId] = useState(null);
  const [inventoryError, setInventoryError] = useState('');
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Doctors slide-over panel
  const [doctorsPanelOpen, setDoctorsPanelOpen] = useState(false);
  const [doctorsDepartment, setDoctorsDepartment] = useState(null);

  // When the Low Stock card is clicked, we switch tabs and then need to
  // scroll to + flash the low-stock rows once they've rendered.
  const [pendingHighlight, setPendingHighlight] = useState(false);
  const highlightTimeoutRef = useRef(null);

  const setTab = (tab) => setSearchParams(tab === 'overview' ? {} : { tab });

  useEffect(() => {
    let cancelled = false;
    setLoadingOverview(true);
    api.get('/hospital/overview')
      .then((res) => { if (!cancelled) setOverview(res.data); })
      .catch((err) => { if (!cancelled) setOverviewError(err.response?.data?.message || 'Could not load dashboard stats.'); })
      .finally(() => { if (!cancelled) setLoadingOverview(false); });
    return () => { cancelled = true; };
  }, []);

  const loadInventory = useCallback(() => {
    setLoadingInventory(true);
    setInventoryError('');
    api.get('/hospital/inventory')
      .then((res) => setItems(res.data))
      .catch((err) => setInventoryError(err.response?.data?.message || 'Could not load inventory.'))
      .finally(() => setLoadingInventory(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventory();
    }
  }, [activeTab, loadInventory]);

  const loadAppointments = useCallback(() => {
    setLoadingAppointments(true);
    setAppointmentsError('');
    api.get('/hospital/appointments')
      .then((res) => setAppointments(res.data))
      .catch((err) => setAppointmentsError(err.response?.data?.message || 'Could not load appointments.'))
      .finally(() => setLoadingAppointments(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'appointments') {
      loadAppointments();
    }
  }, [activeTab, loadAppointments]);

  const updateAppointmentStatus = async (id, status) => {
    setUpdatingApptId(id);
    try {
      const res = await api.put(`/hospital/appointments/${id}/status`, { status });
      setAppointments((prev) => prev.map((a) => (a._id === id ? res.data : a)));
    } catch (err) {
      setAppointmentsError(err.response?.data?.message || 'Could not update this appointment.');
    } finally {
      setUpdatingApptId(null);
    }
  };

  // Scroll to + flash-highlight the low-stock rows twice, then clear.
  useEffect(() => {
    if (activeTab !== 'inventory' || !pendingHighlight || loadingInventory) return;

    const rows = document.querySelectorAll('.inventory-table tr.low-stock');
    if (rows.length === 0) {
      setPendingHighlight(false);
      return;
    }

    rows[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    rows.forEach((row) => row.classList.add('flash-highlight'));

    highlightTimeoutRef.current = setTimeout(() => {
      rows.forEach((row) => row.classList.remove('flash-highlight'));
      setPendingHighlight(false);
    }, 1500);

    return () => clearTimeout(highlightTimeoutRef.current);
  }, [activeTab, pendingHighlight, loadingInventory, items]);

  const handleLowStockClick = () => {
    if (!overview?.lowStockCount) return;
    setPendingHighlight(true);
    setTab('inventory');
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/hospital/inventory/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setInventoryError(err.response?.data?.message || 'Could not delete that item.');
    } finally {
      setDeletingId(null);
    }
  };

  const startEditItem = (item) => {
    setEditingItemId(item._id);
    setEditForm({
      quantity: item.stockInformation?.quantity ?? 0,
      reorderLevel: item.stockInformation?.reorderLevel ?? 0,
      unitPrice: item.stockInformation?.unitPrice ?? 0,
    });
  };

  const cancelEditItem = () => setEditingItemId(null);

  const saveEditItem = async (id) => {
    setSavingItemId(id);
    try {
      const res = await api.put(`/hospital/inventory/${id}`, {
        'stockInformation.quantity': Number(editForm.quantity),
        'stockInformation.reorderLevel': Number(editForm.reorderLevel),
        'stockInformation.unitPrice': Number(editForm.unitPrice),
      });
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, ...res.data } : item)));
      setEditingItemId(null);
    } catch (err) {
      setInventoryError(err.response?.data?.message || 'Could not update that item.');
    } finally {
      setSavingItemId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return true;
    return item.itemName?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q);
  });

  const openDoctors = (department = null) => {
    setDoctorsDepartment(department);
    setDoctorsPanelOpen(true);
  };

  return (
    <>
      <Navbar />
      <div className="hospital-dashboard">
        <div className="dashboard-header">
          <div>
            <h1>{overview?.hospitalName || 'Hospital Dashboard'}</h1>
            {overview?.city && <p className="dashboard-subtitle">{overview.city}</p>}
          </div>
        </div>

        <div className="dashboard-layout">
        <div className="dashboard-main">
        <div className="dashboard-tabs" style={{ '--tab-count': TABS.length }}>
          <button
            type="button"
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={activeTab === 'inventory' ? 'active' : ''}
            onClick={() => setTab('inventory')}
          >
            Inventory
          </button>
          <button
            type="button"
            className={activeTab === 'appointments' ? 'active' : ''}
            onClick={() => setTab('appointments')}
          >
            Appointments
          </button>
          <span
            className="dashboard-tabs-indicator"
            style={{ transform: `translateX(${activeTabIndex * 100}%)` }}
            aria-hidden="true"
          />
        </div>

        {activeTab === 'overview' && (
          <section>
            {loadingOverview && <p className="dashboard-status">Loading stats…</p>}
            {overviewError && <p className="dashboard-status error">{overviewError}</p>}
            {overview && !loadingOverview && (
              <>
                <div className="stats-grid">
                  <BedsCard bedsAvailable={overview.bedsAvailable} bedsTotal={overview.bedsTotal} delay={0} />
                  <StatCard
                    icon="🩺"
                    label="Doctors on Staff"
                    value={overview.doctorsCount}
                    hint="Tap to see the full list"
                    delay={60}
                    onClick={() => openDoctors(null)}
                  />
                  <StatCard
                    icon="📅"
                    label="Today's Appointments"
                    value={overview.todaysAppointments}
                    hint="Scheduled today"
                    delay={120}
                  />
                  <StatCard
                    icon="⚠️"
                    label="Low Stock Items"
                    value={overview.lowStockCount}
                    hint={overview.lowStockCount > 0 ? 'Tap to jump to Inventory' : 'All stocked'}
                    variant={overview.lowStockCount > 0 ? 'warning' : undefined}
                    delay={180}
                    onClick={overview.lowStockCount > 0 ? handleLowStockClick : undefined}
                  />
                </div>

                {overview.lowStockItems?.length > 0 && (
                  <div className="alert-card">
                    <div className="alert-card-header">
                      <h3>⚠️ Low Stock Alerts</h3>
                      <button type="button" className="alert-view-all" onClick={handleLowStockClick}>
                        View in Inventory →
                      </button>
                    </div>
                    <ul className="alert-list">
                      {overview.lowStockItems.map((item) => (
                        <li key={item.itemName}>
                          <span className="alert-item-name">{item.itemName}</span>
                          <span className="alert-item-qty">
                            {item.quantity} left <span className="alert-item-threshold">· reorder at {item.reorderLevel}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {overview.departmentBreakdown?.length > 0 && (
                  <div className="departments-card">
                    <div className="departments-card-header">
                      <h3>Departments</h3>
                      <span className="departments-hint">Tap a department to see its doctors</span>
                    </div>
                    <div className="department-grid">
                      {overview.departmentBreakdown.map((dept, i) => (
                        <button
                          type="button"
                          className="department-card"
                          key={dept.department}
                          onClick={() => openDoctors(dept.department)}
                          style={{ animationDelay: `${300 + i * 40}ms` }}
                        >
                          <span className="department-card-name">{dept.department}</span>
                          <span className="department-card-count">{dept.doctorCount}</span>
                          <span className="department-card-label">
                            doctor{dept.doctorCount === 1 ? '' : 's'}
                          </span>
                          <span className={`department-card-available ${dept.availableCount === 0 ? 'none' : ''}`}>
                            {dept.availableCount} available now
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'inventory' && (
          <section>
            <div className="inventory-toolbar">
              <span>{filteredItems.length} of {items.length} item{items.length === 1 ? '' : 's'}</span>
              <input
                type="text"
                className="inventory-search"
                placeholder="Search items or SKU…"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
              />
              <Link to="/hospital/inventory/new" className="btn-primary-link">+ Add Item</Link>
            </div>

            {loadingInventory && <p className="dashboard-status">Loading inventory…</p>}
            {inventoryError && <p className="dashboard-status error">{inventoryError}</p>}

            {!loadingInventory && items.length === 0 && !inventoryError && (
              <p className="dashboard-status">No inventory items yet. Add your first one above.</p>
            )}

            {!loadingInventory && items.length > 0 && filteredItems.length === 0 && (
              <p className="dashboard-status">No items match "{inventorySearch}".</p>
            )}

            {filteredItems.length > 0 && (
              <div className="inventory-table-wrap">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Reorder At</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const low = item.stockInformation?.quantity <= item.stockInformation?.reorderLevel;
                      const isEditing = editingItemId === item._id;

                      if (isEditing) {
                        return (
                          <tr key={item._id} className="editing-row">
                            <td>{item.itemName}</td>
                            <td>{item.itemCategory}</td>
                            <td>{item.sku}</td>
                            <td>
                              <input
                                type="number"
                                className="row-edit-input"
                                min="0"
                                value={editForm.quantity}
                                onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="row-edit-input"
                                min="0"
                                value={editForm.reorderLevel}
                                onChange={(e) => setEditForm((f) => ({ ...f, reorderLevel: e.target.value }))}
                              />
                            </td>
                            <td className="row-edit-actions">
                              <button
                                type="button"
                                className="row-save"
                                onClick={() => saveEditItem(item._id)}
                                disabled={savingItemId === item._id}
                              >
                                {savingItemId === item._id ? '…' : 'Save'}
                              </button>
                              <button type="button" className="row-cancel" onClick={cancelEditItem}>
                                Cancel
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={item._id} className={low ? 'low-stock' : ''}>
                          <td>{item.itemName}</td>
                          <td>{item.itemCategory}</td>
                          <td>{item.sku}</td>
                          <td>
                            {item.stockInformation?.quantity}
                            {low && <span className="low-badge">Low</span>}
                          </td>
                          <td>{item.stockInformation?.reorderLevel}</td>
                          <td className="row-edit-actions">
                            <button
                              type="button"
                              className="row-edit"
                              onClick={() => startEditItem(item)}
                            >
                              Restock
                            </button>
                            <button
                              type="button"
                              className="row-delete"
                              onClick={() => handleDelete(item._id)}
                              disabled={deletingId === item._id}
                            >
                              {deletingId === item._id ? '…' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === 'appointments' && (
          <section>
            <div className="inventory-toolbar">
              <span>{appointments.length} appointment{appointments.length === 1 ? '' : 's'}</span>
            </div>

            {loadingAppointments && <p className="dashboard-status">Loading appointments…</p>}
            {appointmentsError && <p className="dashboard-status error">{appointmentsError}</p>}

            {!loadingAppointments && appointments.length === 0 && !appointmentsError && (
              <p className="dashboard-status">No appointments booked yet.</p>
            )}

            {appointments.length > 0 && (
              <div className="inventory-table-wrap">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Department</th>
                      <th>Date / Time</th>
                      <th>Bed</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt._id} className={appt.isEmergency ? 'emergency-row' : ''}>
                        <td>
                          {appt.patientName}
                          {appt.isEmergency && <span className="emergency-badge">🚨 Urgent</span>}
                        </td>
                        <td>{appt.doctor?.name || '—'}</td>
                        <td>{appt.department}</td>
                        <td>{appt.date} · {appt.time}</td>
                        <td>{appt.requiresBed ? '🛏️ Yes' : '—'}</td>
                        <td>
                          <span className={`appt-status appt-status-${appt.status}`}>{appt.status}</span>
                        </td>
                        <td className="row-edit-actions">
                          {appt.status === 'scheduled' && (
                            <>
                              <button
                                type="button"
                                className="row-save"
                                onClick={() => updateAppointmentStatus(appt._id, 'completed')}
                                disabled={updatingApptId === appt._id}
                              >
                                {updatingApptId === appt._id ? '…' : 'Complete'}
                              </button>
                              <button
                                type="button"
                                className="row-delete"
                                onClick={() => updateAppointmentStatus(appt._id, 'cancelled')}
                                disabled={updatingApptId === appt._id}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        </div>

        <aside className="dashboard-sidebar">
          <div className="sidebar-card">
            <h3>Hospital Info</h3>
            <dl className="sidebar-info-list">
              <div>
                <dt>Address</dt>
                <dd>{overview?.address || overview?.city || '—'}</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>{overview?.city || '—'}</dd>
              </div>
              <div>
                <dt>Bed Occupancy</dt>
                <dd>
                  {overview ? `${overview.bedsTotal - overview.bedsAvailable} / ${overview.bedsTotal} occupied` : '—'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="sidebar-card">
            <h3>Quick Actions</h3>
            <Link to="/hospital/inventory/new" className="sidebar-action">+ Add Inventory Item</Link>
            <button type="button" className="sidebar-action" onClick={() => openDoctors(null)}>
              👥 View All Doctors
            </button>
            <Link to="/hospital/profile" className="sidebar-action">✏️ Edit Hospital Profile</Link>
            <button
              type="button"
              className="sidebar-action"
              onClick={() => setTab(activeTab === 'inventory' ? 'overview' : 'inventory')}
            >
              🔁 Switch to {activeTab === 'inventory' ? 'Overview' : 'Inventory'}
            </button>
          </div>

          {overview?.lowStockCount > 0 && (
            <div className="sidebar-card sidebar-card-warning">
              <h3>⚠️ Needs Attention</h3>
              <p>{overview.lowStockCount} item{overview.lowStockCount === 1 ? '' : 's'} running low on stock.</p>
              <button type="button" className="sidebar-action-warning" onClick={handleLowStockClick}>
                Review Now →
              </button>
            </div>
          )}
        </aside>
        </div>
      </div>

      <DoctorsPanel
        open={doctorsPanelOpen}
        department={doctorsDepartment}
        onClose={() => setDoctorsPanelOpen(false)}
      />
    </>
  );
}

export default Dashboard;