import React, { useEffect, useState } from 'react';
import Navbar from '../Navbar/Navbar';
import './Home.css';
import Carousel from './Carousel';
import { Link } from 'react-router-dom';
import api from '../api/client';

const PROCESS_STEPS = [
  { icon: '🔑', title: 'Login as Patient', text: 'Log in, or create a patient account in under a minute.' },
  { icon: '🔍', title: 'Browse Hospitals', text: 'Filter by department, distance, and availability.' },
  { icon: '📅', title: 'Pick a Time', text: 'See real open slots for that department — or book urgent care instantly.' },
  { icon: '🩺', title: "You're Assigned", text: "We match you with whichever available doctor is least busy — automatically." },
  { icon: '✅', title: 'Show Up', text: 'Your appointment, doctor, and hospital are all confirmed and on record.' },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Real availability, not guesswork',
    text: "Bed counts and doctor schedules are live — what you see is what's actually open, not a static estimate.",
  },
  {
    icon: '🎯',
    title: 'Smart doctor matching',
    text: "You don't pick a specific doctor and hope they're free — we assign whoever's least busy in your department.",
  },
  {
    icon: '🚨',
    title: 'One-tap emergencies',
    text: 'On mobile, SOS finds your nearest hospital by real distance and dispatches help immediately — no forms to fill out.',
  },
  {
    icon: '🔒',
    title: 'Your records, secured',
    text: 'Passwords are hashed, sessions expire safely, and only you can see or edit your own medical profile.',
  },
];

const DEPARTMENTS = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics',
  'Gynecology', 'ENT', 'Dermatology', 'Neurology', 'Emergency',
  'Radiology', 'Oncology', 'Urology',
];

function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/public/stats')
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, []);

  return (
    <div>
      <Navbar />
      <Carousel />

      {stats && (
        <section className="stats-banner">
          <div className="stat-block">
            <span className="stat-number">{stats.hospitalCount}+</span>
            <span className="stat-label">Hospitals on the network</span>
          </div>
          <div className="stat-block">
            <span className="stat-number">{stats.doctorCount}+</span>
            <span className="stat-label">Doctors available to book</span>
          </div>
          <div className="stat-block">
            <span className="stat-number">{stats.cityCount}</span>
            <span className="stat-label">Cities covered</span>
          </div>
        </section>
      )}

      <div className="process-flow">
        <h2>How It Works</h2>
        <div className="process-steps">
          {PROCESS_STEPS.map((step, i) => (
            <div className="step" key={step.title}>
              <span className="step-icon" aria-hidden="true">{step.icon}</span>
              <p className="step-title">{i + 1}. {step.title}</p>
              <p className="step-text">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="features-section">
        <h2>Why It's Built This Way</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <span className="feature-icon" aria-hidden="true">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="departments-section">
        <h2>Departments We Cover</h2>
        <div className="department-chip-list">
          {DEPARTMENTS.map((d) => (
            <span className="department-chip" key={d}>{d}</span>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <h2>Ready when you are</h2>
        <p>Find a hospital, get matched with a doctor, and book — all in a few taps.</p>
        <div className="home-cta-actions">
          <Link to="/register/patient" className="home-cta-primary">Create a Patient Account</Link>
          <Link to="/login/patient" className="home-cta-secondary">I already have one</Link>
        </div>
      </section>
    </div>
  );
}

export default Home;