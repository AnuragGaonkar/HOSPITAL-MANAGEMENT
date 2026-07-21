import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import './EmergencyButton.css';

// Mobile-only SOS control. Captures the user's real location via the
// Geolocation API and dispatches a real request to the backend, which
// finds the actual nearest hospital and assigns a real doctor.

const STAGES = {
  IDLE: 'idle',
  CONFIRM: 'confirm',
  LOCATING: 'locating',
  DISPATCHING: 'dispatching',
  TRACKING: 'tracking',
  ERROR: 'error',
  NEEDS_LOGIN: 'needs-login',
};

export default function EmergencyButton() {
  const { isAuthenticated, user } = useAuth();
  const [stage, setStage] = useState(STAGES.IDLE);
  const [dispatch, setDispatch] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [etaLeft, setEtaLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (stage !== STAGES.TRACKING || !dispatch) return undefined;
    setEtaLeft(dispatch.etaMinutes * 60);
    timerRef.current = setInterval(() => {
      setEtaLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [stage, dispatch]);

  const closeAll = () => {
    clearInterval(timerRef.current);
    setStage(STAGES.IDLE);
    setDispatch(null);
    setErrorMsg('');
  };

  const startEmergency = () => {
    if (!isAuthenticated || user.role !== 'patient') {
      setStage(STAGES.NEEDS_LOGIN);
      return;
    }
    setStage(STAGES.CONFIRM);
  };

  const confirmEmergency = () => {
    if (!('geolocation' in navigator)) {
      setErrorMsg('Location is not available on this device/browser.');
      setStage(STAGES.ERROR);
      return;
    }
    setStage(STAGES.LOCATING);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStage(STAGES.DISPATCHING);
        try {
          const res = await api.post('/emergency', {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setDispatch(res.data);
          setStage(STAGES.TRACKING);
        } catch (err) {
          setErrorMsg(err.response?.data?.message || 'Could not reach dispatch. Please call emergency services directly.');
          setStage(STAGES.ERROR);
        }
      },
      () => {
        setErrorMsg('Location permission was denied. We need it to send help to you.');
        setStage(STAGES.ERROR);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="emergency-root">
      <button
        type="button"
        className="emergency-fab"
        onClick={startEmergency}
        aria-label="Request emergency ambulance"
      >
        <span className="emergency-fab-pulse" aria-hidden="true" />
        <span className="emergency-fab-icon" aria-hidden="true">✚</span>
        <span className="emergency-fab-label">SOS</span>
      </button>

      {stage !== STAGES.IDLE && (
        <div className="emergency-overlay" role="dialog" aria-modal="true">
          <div className="emergency-sheet">
            {stage === STAGES.NEEDS_LOGIN && (
              <>
                <h3>Log in to request help</h3>
                <p>
                  Emergency dispatch needs to know who and where you are, so
                  it's tied to a patient account. Log in or create one —
                  it only takes a moment.
                </p>
                <div className="emergency-actions">
                  <button className="btn-secondary" onClick={closeAll}>Cancel</button>
                  <Link to="/login/patient" className="btn-emergency" onClick={closeAll}>
                    Log In
                  </Link>
                </div>
              </>
            )}

            {stage === STAGES.CONFIRM && (
              <>
                <h3>Request emergency help?</h3>
                <p>
                  We'll share your live location with the nearest hospital so
                  they can send an ambulance and a doctor to you right away.
                </p>
                <div className="emergency-actions">
                  <button className="btn-secondary" onClick={closeAll}>Cancel</button>
                  <button className="btn-emergency" onClick={confirmEmergency}>
                    Yes, send help
                  </button>
                </div>
              </>
            )}

            {stage === STAGES.LOCATING && (
              <div className="emergency-status">
                <span className="spinner" aria-hidden="true" />
                <p>Finding your location…</p>
              </div>
            )}

            {stage === STAGES.DISPATCHING && (
              <div className="emergency-status">
                <span className="spinner" aria-hidden="true" />
                <p>Alerting the nearest hospital…</p>
              </div>
            )}

            {stage === STAGES.TRACKING && dispatch && (
              <>
                <h3>Help is on the way</h3>
                <div className="emergency-eta">
                  <span className="emergency-eta-time">{formatTime(etaLeft)}</span>
                  <span className="emergency-eta-caption">estimated arrival</span>
                </div>
                <div className="emergency-progress-track">
                  <div
                    className="emergency-progress-fill"
                    style={{
                      width: `${100 - (etaLeft / (dispatch.etaMinutes * 60)) * 100}%`,
                    }}
                  />
                </div>
                <ul className="emergency-details">
                  <li><strong>Hospital:</strong> {dispatch.hospitalName} ({dispatch.distanceKm} km away)</li>
                  <li><strong>Ambulance:</strong> {dispatch.ambulanceId}</li>
                  <li><strong>Doctor on board:</strong> {dispatch.doctorName}</li>
                </ul>
                <div className="emergency-actions">
                  <a className="btn-secondary" href="tel:102">Call hospital</a>
                  <button className="btn-secondary" onClick={closeAll}>Close</button>
                </div>
              </>
            )}

            {stage === STAGES.ERROR && (
              <>
                <h3>Something went wrong</h3>
                <p>{errorMsg}</p>
                <div className="emergency-actions">
                  <button className="btn-secondary" onClick={closeAll}>Close</button>
                  <button className="btn-emergency" onClick={confirmEmergency}>Try again</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}