import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './User.css';
import logo from './logo.png';
import axios from 'axios';

function User() {
  const location = useLocation();
  const { name } = location.state || { name: 'User' };

  const [profilePic, setProfilePic] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchProfilePic = async () => {
      try {
        const encodedName = encodeURIComponent(name);
        const response = await axios.get(`http://localhost:5000/uploads/${encodedName}.jpg`, { responseType: 'blob' });
        
        // Create a URL for the image and set it in state
        const imageUrl = URL.createObjectURL(response.data);
        setProfilePic(imageUrl);
      } catch (error) {
        console.error('Error fetching the profile picture:', error);
      }
    };
  
    fetchProfilePic();
  }, [name]);
  

  const toggleProfileMenu = () => {
    if (window.innerWidth < 769) {
      setMobileMenuOpen(true);
    } else {
      setProfileMenuOpen(!profileMenuOpen);
    }
  };

  const closeMenu = () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="user-navbar">
        <a className="user-navbar-brand" href="#">
          <img src={logo} alt="Logo" className="user-navbar-logo" />
          <span className="user-navbar-title">HOSPITAL MANAGEMENT SYSTEM</span>
        </a>
        <ul className="user-nav-links">
          <li>
            <a className="nav-link" href="#">Home</a>
          </li>
          <li>
            <a className="nav-link" href="#">Book an Appointment</a>
          </li>
        </ul>
        <div className={`user-profile-toggle ${window.innerWidth < 769 ? 'mobile' : ''}`}>
          <img
            src={profilePic || logo}
            alt="Profile Picture"
            className="user-profile-pic"
            onClick={toggleProfileMenu}
          />
          {window.innerWidth >= 769 && (
            <div
              className={`user-profile-dropdown ${profileMenuOpen ? 'show' : ''}`}
              onMouseLeave={() => setProfileMenuOpen(false)}
            >
              <a href="#/account" className="user-dropdown-item" onClick={closeMenu}>Profile</a>
              <a href="/" className="user-dropdown-item" onClick={closeMenu}>Log Out</a>
            </div>
          )}
        </div>
      </nav>

      <div className={`user-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button className="user-close-btn" onClick={closeMenu}>×</button>
        <ul className="user-mobile-nav-links">
          <li><a href="#" onClick={closeMenu}>Home</a></li>
          <li><a href="#" onClick={closeMenu}>Book an Appointment</a></li>
          <li><a href="#/account" onClick={closeMenu}>Profile</a></li>
          <li><a href="/" onClick={closeMenu}>Log Out</a></li>
        </ul>
      </div>

      <div className="user-container">
        <h1>Welcome, {name}</h1>
        <div className="user-profile-info">
          <img src={profilePic || logo} alt="Profile Logo" className="user-profile-logo" />
        </div>
      </div>
    </>
  );
}

export default User;