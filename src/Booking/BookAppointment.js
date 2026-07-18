import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../Navbar/Navbar';
import api, { API_BASE_URL } from '../api/client';
import './BookAppointment.css';

const AVAILABILITY_LABEL = {
  available: 'Available',
  'on-leave': 'On Leave',
  'in-surgery': 'In Surgery',
};

// Straight-line distance between two lat/lng points, in km.
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function HospitalCard({ hospital, distanceKm, onSelect }) {
  return (
    <button type="button" className="hospital-card" onClick={() => onSelect(hospital)}>
      <div className="hospital-card-photo">
        {hospital.photoUrl ? (
          <img src={`${API_BASE_URL}/${hospital.photoUrl}`} alt={hospital.hospitalName} />
        ) : (
          <span>{hospital.hospitalName.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="hospital-card-body">
        <div className="hospital-card-top">
          <h3>{hospital.hospitalName}</h3>
          {distanceKm != null && <span className="hospital-distance">{distanceKm.toFixed(1)} km away</span>}
        </div>
        <p className="hospital-card-address">{hospital.address || hospital.city}</p>
        <div className="hospital-card-tags">
          {hospital.departments?.slice(0, 4).map((d) => (
            <span className="hospital-tag" key={d}>{d}</span>
          ))}
          {hospital.departments?.length > 4 && (
            <span className="hospital-tag hospital-tag-more">+{hospital.departments.length - 4} more</span>
          )}
        </div>
        <span className={`hospital-beds ${hospital.bedsAvailable === 0 ? 'none' : ''}`}>
          🛏️ {hospital.bedsAvailable} / {hospital.bedsTotal} beds available
        </span>
      </div>
      <span className="hospital-card-arrow" aria-hidden="true">→</span>
    </button>
  );
}

function BookingPanel({ hospital, onClose, onBooked }) {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [form, setForm] = useState({ department: '', date: '', time: '', requiresBed: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    setLoadingDoctors(true);
    api.get(`/hospitals/${hospital._id}/doctors`)
      .then((res) => setDoctors(res.data))
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false));
  }, [hospital._id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/appointments', { hospitalId: hospital._id, ...form });
      setResult(res.data);
      onBooked?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not book this appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const visibleDoctors = form.department
    ? doctors.filter((d) => d.specialization === form.department)
    : doctors;

  return (
    <>
      <div className="booking-overlay open" onClick={onClose} />
      <aside className="booking-panel open">
        <div className="booking-panel-header">
          <div>
            <h2>{hospital.hospitalName}</h2>
            <p>{hospital.address || hospital.city}</p>
          </div>
          <button type="button" className="booking-panel-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="booking-panel-body">
          {result ? (
            <div className="booking-panel-success">
              <div className="booking-success-icon">✓</div>
              <h3>You're booked in</h3>
              <p>
                Assigned to <strong>{result.assignedDoctor.name}</strong> ({result.assignedDoctor.specialization})
                on <strong>{form.date}</strong> at <strong>{form.time}</strong>.
                {form.requiresBed && ' A bed has been held for you.'}
              </p>
              <button type="button" className="btn-primary" onClick={onClose}>Done</button>
            </div>
          ) : (
            <>
              <section className="booking-panel-section">
                <h4>Meet the doctors here</h4>
                {loadingDoctors && <p className="booking-panel-status">Loading doctors…</p>}
                {!loadingDoctors && visibleDoctors.length === 0 && (
                  <p className="booking-panel-status">No doctors listed for this selection yet.</p>
                )}
                <div className="doctor-preview-list">
                  {visibleDoctors.map((doc) => (
                    <div className="doctor-preview-card" key={doc._id}>
                      <div className="doctor-preview-avatar">
                        {doc.photoUrl ? (
                          <img src={`${API_BASE_URL}/${doc.photoUrl}`} alt="" />
                        ) : (
                          doc.name.replace('Dr. ', '').charAt(0)
                        )}
                      </div>
                      <div>
                        <span className="doctor-preview-name">{doc.name}</span>
                        <span className="doctor-preview-spec">{doc.specialization} · {doc.experienceYears} yrs</span>
                      </div>
                      <span className={`availability-badge availability-${doc.availability}`}>
                        <span className="availability-dot" aria-hidden="true" />
                        {AVAILABILITY_LABEL[doc.availability]}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="booking-panel-section">
                <h4>Why book here?</h4>
                <p className="booking-why-text">
                  Booking through the platform automatically matches you with whichever
                  available doctor in your chosen department currently has the lightest
                  patient load — so you're not stuck waiting behind a queue for one
                  specific doctor when others are free.
                </p>
              </section>

              <form className="booking-panel-form" onSubmit={handleSubmit}>
                <label>
                  Department
                  <select name="department" value={form.department} onChange={handleChange} required>
                    <option value="" disabled>Select department</option>
                    {hospital.departments?.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
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

                <label className="booking-checkbox">
                  <input type="checkbox" name="requiresBed" checked={form.requiresBed} onChange={handleChange} />
                  This visit requires admission (holds a bed)
                </label>

                {/* NOTE: "available timings" here is a free date/time pick, not a
                    real per-doctor slot calendar — that's a bigger scheduling
                    feature to build separately once scoped. */}

                {error && <p className="booking-panel-status error">{error}</p>}

                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Booking…' : 'Confirm Booking'}
                </button>
              </form>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export default function BookAppointment() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [maxDistance, setMaxDistance] = useState('any');
  const [sortBy, setSortBy] = useState('name');

  const [myLocation, setMyLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | loading | granted | denied

  const [selectedHospital, setSelectedHospital] = useState(null);

  useEffect(() => {
    api.get('/hospitals')
      .then((res) => setHospitals(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load hospitals.'))
      .finally(() => setLoading(false));
  }, []);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const allDepartments = useMemo(() => {
    const set = new Set();
    hospitals.forEach((h) => h.departments?.forEach((d) => set.add(d)));
    return Array.from(set).sort();
  }, [hospitals]);

  const withDistance = useMemo(() => {
    return hospitals.map((h) => ({
      ...h,
      distanceKm: myLocation && h.location?.lat != null
        ? haversineKm(myLocation.lat, myLocation.lng, h.location.lat, h.location.lng)
        : null,
    }));
  }, [hospitals, myLocation]);

  const filteredHospitals = useMemo(() => {
    let list = withDistance;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((h) => h.hospitalName.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q));
    }
    if (department) {
      list = list.filter((h) => h.departments?.includes(department));
    }
    if (maxDistance !== 'any' && myLocation) {
      list = list.filter((h) => h.distanceKm != null && h.distanceKm <= Number(maxDistance));
    }

    list = [...list].sort((a, b) => {
      if (sortBy === 'distance' && myLocation) {
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      }
      return a.hospitalName.localeCompare(b.hospitalName);
    });

    return list;
  }, [withDistance, search, department, maxDistance, sortBy, myLocation]);

  return (
    <>
      <Navbar />
      <div className="booking-browse-page">
        <aside className="booking-filters">
          <h2>Find a Hospital</h2>

          <div className="filter-group">
            <label htmlFor="hospital-search">Search</label>
            <input
              id="hospital-search"
              type="text"
              placeholder="Hospital or city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="department-filter">Department</label>
            <select id="department-filter" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All departments</option>
              {allDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Distance</label>
            {locationStatus === 'granted' ? (
              <select value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)}>
                <option value="any">Any distance</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
              </select>
            ) : (
              <button type="button" className="location-btn" onClick={requestLocation} disabled={locationStatus === 'loading'}>
                {locationStatus === 'loading' ? 'Locating…' : '📍 Use my location'}
              </button>
            )}
            {locationStatus === 'denied' && (
              <span className="filter-hint error">Location unavailable — distance filtering is off.</span>
            )}
          </div>

          <div className="filter-group">
            <label htmlFor="sort-filter">Sort by</label>
            <select id="sort-filter" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name</option>
              <option value="distance" disabled={locationStatus !== 'granted'}>Distance</option>
            </select>
          </div>

          <div className="filter-summary">
            {filteredHospitals.length} of {hospitals.length} hospitals
          </div>
        </aside>

        <div className="booking-results">
          {loading && <p className="booking-results-status">Loading hospitals…</p>}
          {loadError && <p className="booking-results-status error">{loadError}</p>}
          {!loading && filteredHospitals.length === 0 && !loadError && (
            <p className="booking-results-status">No hospitals match your filters.</p>
          )}

          <div className="hospital-card-list">
            {filteredHospitals.map((h) => (
              <HospitalCard
                key={h._id}
                hospital={h}
                distanceKm={h.distanceKm}
                onSelect={setSelectedHospital}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedHospital && (
        <BookingPanel
          hospital={selectedHospital}
          onClose={() => setSelectedHospital(null)}
          onBooked={() => {}}
        />
      )}
    </>
  );
}