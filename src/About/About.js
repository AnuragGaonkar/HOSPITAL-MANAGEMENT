import React from 'react';
import Navbar from '../Navbar/Navbar';
import './About.css';

const FEATURES = [
  {
    icon: '🏥',
    title: 'Unified hospital network',
    text: 'Every partner hospital manages its beds, doctors, and inventory on one platform, so patients get an accurate, real-time picture instead of outdated phone-line info.',
  },
  {
    icon: '📅',
    title: 'Book appointments in minutes',
    text: 'Choose a hospital, a department, and a slot that fits your schedule — no queueing at the front desk just to book a consultation.',
  },
  {
    icon: '📍',
    title: 'Find the closest hospital',
    text: 'See nearby hospitals on a map with live distance and availability, so you can make a fast, informed choice — especially when every minute counts.',
  },
  {
    icon: '🚑',
    title: 'One-tap emergency response',
    text: 'On mobile, a single SOS tap shares your location with the nearest hospital, dispatches an ambulance with a doctor on board, and lets you track it arrive in real time.',
  },
];

function About() {
  return (
    <div>
      <Navbar />
      <div className="about-page">
        <section className="about-hero">
          <h1>About the Hospital Management System</h1>
          <p>
            We connect patients and hospitals on a single platform — built to make
            healthcare easier to reach, easier to book, and faster to respond to
            when it's urgent.
          </p>
        </section>

        <section className="about-features">
          {FEATURES.map((f) => (
            <div className="about-feature-card" key={f.title}>
              <div className="about-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </section>

        <section className="about-mission">
          <h2>Our mission</h2>
          <p>
            Healthcare shouldn't depend on knowing the right phone number or
            standing in the right line. We're building the infrastructure that
            lets any hospital come online, list real availability, and be found
            by the people who need care nearby — from a routine check-up to a
            genuine emergency.
          </p>
        </section>
      </div>
    </div>
  );
}

export default About;