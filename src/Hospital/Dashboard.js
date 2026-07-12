import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import api from '../api/client';
import './Dashboard.css';

function StatCard({ icon, label, value, hint, variant, delay }) {
  return (
    <div className={`stat-card ${variant ? `stat-card-${variant}` : ''}`} style={{ animationDelay: `${delay}ms` }}>
      <span className="stat-icon" aria-hidden="true">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {hint && <span className="stat-hint">{hint}</span>}
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
  const activeTab = searchParams.get('tab') === 'inventory' ? 'inventory' : 'overview';

  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState('');
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [items, setItems] = useState([]);
  const [inventoryError, setInventoryError] = useState('');
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const setTab = (tab) => setSearchParams(tab === 'inventory' ? { tab: 'inventory' } : {});

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

  return (
    <>
      <Navbar />
      <div className="hospital-dashboard">
        <div className="dashboard-header">
          <div>
            <h1>{overview?.hospitalName || 'Hospital Dashboard'}</h1>
            {overview?.city && <p className="dashboard-subtitle">{overview.city}</p>}
          </div>
          <div className="dashboard-tabs">
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
          </div>
        </div>

        {activeTab === 'overview' && (
          <section>
            {loadingOverview && <p className="dashboard-status">Loading stats…</p>}
            {overviewError && <p className="dashboard-status error">{overviewError}</p>}
            {overview && !loadingOverview && (
              <>
                <div className="stats-grid">
                  <BedsCard bedsAvailable={overview.bedsAvailable} bedsTotal={overview.bedsTotal} delay={0} />
                  <StatCard icon="🩺" label="Doctors on Staff" value={overview.doctorsCount} delay={60} />
                  <StatCard
                    icon="📅"
                    label="Today's Appointments"
                    value={overview.todaysAppointments}
                    hint="Booking system coming soon"
                    delay={120}
                  />
                  <StatCard
                    icon="⚠️"
                    label="Low Stock Items"
                    value={overview.lowStockCount}
                    hint={overview.lowStockCount > 0 ? 'Needs reordering' : 'All stocked'}
                    variant={overview.lowStockCount > 0 ? 'warning' : undefined}
                    delay={180}
                  />
                </div>

                {overview.lowStockItems?.length > 0 && (
                  <div className="alert-card">
                    <div className="alert-card-header">
                      <h3>⚠️ Low Stock Alerts</h3>
                      <button type="button" className="alert-view-all" onClick={() => setTab('inventory')}>
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

                {overview.departments?.length > 0 && (
                  <div className="departments-card">
                    <h3>Departments</h3>
                    <div className="department-pills">
                      {overview.departments.map((d) => (
                        <span className="department-pill" key={d}>{d}</span>
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
              <span>{items.length} item{items.length === 1 ? '' : 's'}</span>
              <Link to="/hospital/inventory/new" className="btn-primary-link">+ Add Item</Link>
            </div>

            {loadingInventory && <p className="dashboard-status">Loading inventory…</p>}
            {inventoryError && <p className="dashboard-status error">{inventoryError}</p>}

            {!loadingInventory && items.length === 0 && !inventoryError && (
              <p className="dashboard-status">No inventory items yet. Add your first one above.</p>
            )}

            {items.length > 0 && (
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
                    {items.map((item) => {
                      const low = item.stockInformation?.quantity <= item.stockInformation?.reorderLevel;
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
                          <td>
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
      </div>
    </>
  );
}

export default Dashboard;