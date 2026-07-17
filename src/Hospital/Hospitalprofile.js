import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import api, { API_BASE_URL } from '../api/client';
import './HospitalProfile.css';

export default function HospitalProfile() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(null);
  const [deptInput, setDeptInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    api.get('/hospital/profile')
      .then((res) => setForm(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load hospital profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const addDepartment = () => {
    const dept = deptInput.trim();
    if (!dept || form.departments.includes(dept)) {
      setDeptInput('');
      return;
    }
    setForm((prev) => ({ ...prev, departments: [...prev.departments, dept] }));
    setDeptInput('');
    setSaved(false);
  };

  const removeDepartment = (dept) => {
    setForm((prev) => ({ ...prev, departments: prev.departments.filter((d) => d !== dept) }));
    setSaved(false);
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    setUploadingPhoto(true);
    const photoData = new FormData();
    photoData.append('photo', file);

    try {
      // Don't set Content-Type manually — see PatientRegistration.js for
      // why: axios needs to auto-set it so the multipart boundary is
      // included, which the backend (multer) needs to parse the file.
      const res = await api.put('/hospital/profile/photo', photoData);
      setForm((prev) => ({ ...prev, photoUrl: res.data.photoUrl }));
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Could not upload photo.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setSaving(true);
    try {
      const res = await api.put('/hospital/profile', form);
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
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-header">
            <h1>Hospital Profile</h1>
            <Link to="/hospital/dashboard" className="profile-back-link">← Back to Dashboard</Link>
          </div>

          {loading && <p className="profile-status">Loading profile…</p>}
          {loadError && <p className="profile-status error">{loadError}</p>}

          {form && !loading && (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="profile-photo-section">
                <div className="profile-photo-preview">
                  {form.photoUrl ? (
                    <img src={`${API_BASE_URL}/${form.photoUrl}`} alt={form.hospitalName} />
                  ) : (
                    <span>{(form.hospitalName || 'H').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="profile-photo-controls">
                  <label className="profile-photo-upload-btn">
                    {uploadingPhoto ? 'Uploading…' : form.photoUrl ? 'Change Photo' : 'Upload Photo'}
                    <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} hidden />
                  </label>
                  {photoError && <span className="profile-status error">{photoError}</span>}
                </div>
              </div>

              <label>
                Hospital Name
                <input name="hospitalName" value={form.hospitalName || ''} onChange={handleChange} required />
              </label>

              <div className="profile-row">
                <label>
                  City
                  <input name="city" value={form.city || ''} onChange={handleChange} />
                </label>
                <label>
                  State
                  <input name="state" value={form.state || ''} onChange={handleChange} />
                </label>
              </div>

              <label>
                Address
                <input name="address" value={form.address || ''} onChange={handleChange} />
              </label>

              <label>
                Pincode
                <input name="pincode" value={form.pincode || ''} onChange={handleChange} />
              </label>

              <div className="profile-row">
                <label>
                  Total Beds
                  <input
                    type="number"
                    name="bedsTotal"
                    min="0"
                    value={form.bedsTotal}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Beds Available
                  <input value={`${form.bedsAvailable} (computed automatically)`} disabled />
                </label>
              </div>

              <div className="profile-departments">
                <span className="profile-departments-label">Departments</span>
                <div className="profile-department-chips">
                  {form.departments?.map((dept) => (
                    <span className="profile-dept-chip" key={dept}>
                      {dept}
                      <button type="button" onClick={() => removeDepartment(dept)} aria-label={`Remove ${dept}`}>×</button>
                    </span>
                  ))}
                </div>
                <div className="profile-department-add">
                  <input
                    type="text"
                    placeholder="Add a department (e.g. Neurology)"
                    value={deptInput}
                    onChange={(e) => setDeptInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDepartment(); } }}
                  />
                  <button type="button" onClick={addDepartment}>Add</button>
                </div>
              </div>

              {error && <p className="profile-status error">{error}</p>}
              {saved && <p className="profile-status success">Saved.</p>}

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}