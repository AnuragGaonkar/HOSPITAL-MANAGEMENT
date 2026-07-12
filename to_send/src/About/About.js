import React from 'react';
import Navbar from '../Navbar/Navbar';
import './About.css';  

function About() {
  return (
    <div>
      <Navbar />
      <div className="content">
        <h2>About Us</h2>
        <p>Welcome to our hospital management system. We are dedicated to providing top-quality healthcare services.</p>
      </div>
    </div>
  );
}

export default About;
