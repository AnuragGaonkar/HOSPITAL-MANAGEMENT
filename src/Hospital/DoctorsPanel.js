import React, { useEffect, useState } from 'react';
import api from '../api/client';
import './DoctorsPanel.css';

const AVAILABILITY_LABEL = {
  available: 'Available',
  'on-leave': 'On Leave',
  'in-surgery': 'In Surgery',
};

function AvailabilityBadge({ status }) {
  return (
    <span className={`availability-badge availability-${status}`}>
      <span className="availability-dot" aria-hidden="true" />
      {AVAILABILITY_LABEL[status] || status}
    </span>
  );
}

function AddDoctorForm({ onSave, onCancel, saving, defaultDepartment }) {
  const [form, setForm] = useState({
    name: '',
    specialization: defaultDepartment || '',
    experienceYears: 1,
    availability: 'available',
    contact: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form
      className="doctor-edit-form doctor-add-form"
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
    >
      <label>
        Name
        <input name="name" value={form.name} onChange={handleChange} placeholder="Dr. Full Name" required />
      </label>
      <label>
        Specialization
        <input name="specialization" value={form.specialization} onChange={handleChange} required />
      </label>
      <div className="doctor-edit-row">
        <label>
          Experience (yrs)
          <input
            type="number"
            name="experienceYears"
            value={form.experienceYears}
            onChange={handleChange}
            min="0"
          />
        </label>
        <label>
          Availability
          <select name="availability" value={form.availability} onChange={handleChange}>
            <option value="available">Available</option>
            <option value="on-leave">On Leave</option>
            <option value="in-surgery">In Surgery</option>
          </select>
        </label>
      </div>
      <label>
        Contact
        <input name="contact" value={form.contact} onChange={handleChange} placeholder="+91 ..." />
      </label>
      <div className="doctor-edit-actions">
        <button type="button" className="doctor-edit-cancel" onClick={onCancel}>Cancel</button>
        <button type="submit" className="doctor-edit-save" disabled={saving}>
          {saving ? 'Adding…' : 'Add Doctor'}
        </button>
      </div>
    </form>
  );
}

function EditDoctorForm({ doctor, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: doctor.name,
    specialization: doctor.specialization,
    experienceYears: doctor.experienceYears,
    availability: doctor.availability,
    contact: doctor.contact || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form
      className="doctor-edit-form"
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
    >
      <label>
        Name
        <input name="name" value={form.name} onChange={handleChange} required />
      </label>
      <label>
        Specialization
        <input name="specialization" value={form.specialization} onChange={handleChange} required />
      </label>
      <div className="doctor-edit-row">
        <label>
          Experience (yrs)
          <input
            type="number"
            name="experienceYears"
            value={form.experienceYears}
            onChange={handleChange}
            min="0"
          />
        </label>
        <label>
          Availability
          <select name="availability" value={form.availability} onChange={handleChange}>
            <option value="available">Available</option>
            <option value="on-leave">On Leave</option>
            <option value="in-surgery">In Surgery</option>
          </select>
        </label>
      </div>
      <label>
        Contact
        <input name="contact" value={form.contact} onChange={handleChange} />
      </label>
      <div className="doctor-edit-actions">
        <button type="button" className="doctor-edit-cancel" onClick={onCancel}>Cancel</button>
        <button type="submit" className="doctor-edit-save" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

// Slide-over panel listing doctors, optionally filtered to one department.
// Pass `department={null}` (or omit) to show every doctor at the hospital.
export default function DoctorsPanel({ open, department, onClose }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [addingOpen, setAddingOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const loadDoctors = () => {
    setLoading(true);
    setError('');
    const params = department ? { department } : {};
    api.get('/hospital/doctors', { params })
      .then((res) => setDoctors(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load doctors.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) {
      loadDoctors();
      setAddingOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, department]);

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSave = async (doctorId, form) => {
    setSavingId(doctorId);
    try {
      const res = await api.put(`/hospital/doctors/${doctorId}`, {
        ...form,
        experienceYears: Number(form.experienceYears) || 0,
      });
      setDoctors((prev) => prev.map((d) => (d._id === doctorId ? { ...d, ...res.data } : d)));
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSavingId(null);
    }
  };

  const handleAdd = async (form) => {
    setAdding(true);
    try {
      const res = await api.post('/hospital/doctors', {
        ...form,
        experienceYears: Number(form.experienceYears) || 0,
      });
      setDoctors((prev) => [...prev, { ...res.data, assignedPatients: [] }]);
      setAddingOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add doctor.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (doctorId) => {
    setDeletingId(doctorId);
    try {
      await api.delete(`/hospital/doctors/${doctorId}`);
      setDoctors((prev) => prev.filter((d) => d._id !== doctorId));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove this doctor.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className={`doctors-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`doctors-panel ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="doctors-panel-header">
          <div>
            <h2>{department ? department : 'All Doctors'}</h2>
            {!loading && !error && <p>{doctors.length} doctor{doctors.length === 1 ? '' : 's'}</p>}
          </div>
          <button type="button" className="doctors-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="doctors-panel-toolbar">
          <button
            type="button"
            className="doctors-add-trigger"
            onClick={() => setAddingOpen((prev) => !prev)}
          >
            {addingOpen ? '× Cancel' : '+ Add Doctor'}
          </button>
        </div>

        <div className="doctors-panel-body">
          {addingOpen && (
            <div className="doctor-card doctor-add-card">
              <AddDoctorForm
                defaultDepartment={department}
                saving={adding}
                onCancel={() => setAddingOpen(false)}
                onSave={handleAdd}
              />
            </div>
          )}

          {loading && <p className="doctors-status">Loading doctors…</p>}
          {error && <p className="doctors-status error">{error}</p>}
          {!loading && !error && doctors.length === 0 && !addingOpen && (
            <p className="doctors-status">No doctors on record yet.</p>
          )}

          {doctors.map((doc, i) => {
            const isEditing = editingId === doc._id;
            const isExpanded = expandedId === doc._id;
            const patientCount = doc.assignedPatients?.length || 0;

            return (
              <div className="doctor-card" key={doc._id} style={{ transitionDelay: `${i * 30}ms` }}>
                {isEditing ? (
                  <EditDoctorForm
                    doctor={doc}
                    saving={savingId === doc._id}
                    onCancel={() => setEditingId(null)}
                    onSave={(form) => handleSave(doc._id, form)}
                  />
                ) : (
                  <>
                    <div className="doctor-card-main">
                      <div className="doctor-avatar" aria-hidden="true">
                        {doc.name.replace('Dr. ', '').charAt(0)}
                      </div>
                      <div className="doctor-info">
                        <div className="doctor-name-row">
                          <span className="doctor-name">{doc.name}</span>
                          <AvailabilityBadge status={doc.availability} />
                        </div>
                        <span className="doctor-specialization">{doc.specialization}</span>
                        <span className="doctor-meta">{doc.experienceYears} yrs experience · {doc.contact}</span>
                      </div>
                      <div className="doctor-card-actions">
                        <button
                          type="button"
                          className="doctor-edit-trigger"
                          onClick={() => setEditingId(doc._id)}
                          aria-label={`Edit ${doc.name}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="doctor-delete-trigger"
                          onClick={() => handleDelete(doc._id)}
                          disabled={deletingId === doc._id}
                          aria-label={`Remove ${doc.name}`}
                        >
                          {deletingId === doc._id ? '…' : 'Remove'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="doctor-patients-toggle"
                      onClick={() => setExpandedId(isExpanded ? null : doc._id)}
                    >
                      <span>👥 {patientCount} patient{patientCount === 1 ? '' : 's'} assigned</span>
                      <span className={`doctor-patients-caret ${isExpanded ? 'open' : ''}`}>▾</span>
                    </button>

                    {isExpanded && (
                      <ul className="doctor-patients-list">
                        {patientCount === 0 && <li className="doctor-patients-empty">No patients assigned yet.</li>}
                        {doc.assignedPatients?.map((p, idx) => (
                          <li key={idx}>
                            <span>{p.patientName}</span>
                            <span className="doctor-patient-meta">
                              {p.date} · {p.time}{p.requiresBed ? ' · 🛏️ bed held' : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <button type="button" className="doctors-back-btn" onClick={onClose}>← Back to Dashboard</button>
      </aside>
    </>
  );
}