import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import api from '../api/client';
import './PatientProfile.css';

const FIELD_GROUPS = [
  {
    title: 'Personal Information',
    fields: [
      ['fullName', 'Full Name'],
      ['email', 'Email'],
      ['contactNumber', 'Contact Number'],
      ['address', 'Address'],
      ['weight', 'Weight (kg)'],
      ['height', 'Height (cm)'],
    ],
  },
  {
    title: 'Emergency Contact',
    fields: [
      ['emergencyContactName', 'Name'],
      ['emergencyContactRelation', 'Relation'],
      ['emergencyContactNumber', 'Contact Number'],
    ],
  },
  {
    title: 'Medical Information',
    fields: [
      ['allergies', 'Allergies'],
      ['medications', 'Current Medications'],
      ['pastSurgeries', 'Past Surgeries'],
      ['chronicConditions', 'Chronic Conditions'],
      ['familyHistory', 'Family History'],
      ['preferredDoctor', 'Preferred Doctor'],
    ],
  },
  {
    title: 'Insurance',
    fields: [
      ['insuranceProvider', 'Provider'],
      ['policyNumber', 'Policy Number'],
      ['groupNumber', 'Group Number'],
      ['insuranceContact', 'Insurance Contact'],
    ],
  },
  {
    title: 'Additional Notes',
    fields: [
      ['additionalComments', 'Anything else worth noting'],
    ],
  },
];

const TEXTAREA_FIELDS = new Set([
  'address', 'allergies', 'medications', 'pastSurgeries',
  'chronicConditions', 'familyHistory', 'additionalComments',
]);

export default function PatientProfile() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/patient/profile')
      .then((res) => setForm(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.put('/patient/profile', form);
      setForm(res.data);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="patient-profile-page">
        <div className="patient-profile-card">
          <div className="patient-profile-header">
            <h1>My Profile</h1>
            <Link to="/user" className="profile-back-link">← Back to Home</Link>
          </div>

          {loading && <p className="patient-profile-status">Loading your profile…</p>}
          {loadError && <p className="patient-profile-status error">{loadError}</p>}

          {form && !loading && (
            <form onSubmit={handleSubmit}>
              {FIELD_GROUPS.map((group) => (
                <section key={group.title}>
                  <h3>{group.title}</h3>
                  {group.fields.map(([field, label]) => (
                    <label key={field}>
                      {label}
                      {TEXTAREA_FIELDS.has(field) ? (
                        <textarea
                          value={form[field] || ''}
                          onChange={(e) => handleChange(field, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          value={form[field] || ''}
                          onChange={(e) => handleChange(field, e.target.value)}
                        />
                      )}
                    </label>
                  ))}
                </section>
              ))}

              {error && <p className="patient-profile-status error">{error}</p>}
              {saved && <p className="patient-profile-status success">Saved.</p>}

              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}