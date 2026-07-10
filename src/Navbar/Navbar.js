import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo from './logo.png';
import './Navbar.css';

function Navbar({ showProfile = false, userName = '' }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <img src={logo} alt="Logo" className="logo" />
        <a href="/" className="nav-title">HOSPITAL MANAGEMENT SYSTEM</a>
        <button className="menu-btn" onClick={toggleMenu}>
          ☰
        </button>
        <ul className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          <li>
            <NavLink exact to="/" activeClassName="selected">Home</NavLink>
          </li>
          <li>
            <NavLink to="/about" activeClassName="selected">About Us</NavLink>
          </li>
          {showProfile ? (
            <li className="profile">
              <span className="nav-title">{userName}</span>
              <img src="/path/to/profile-logo.png" alt="Profile Logo" className="profile-logo" />
            </li>
          ) : (
            <li className="dropdown">
              <a href="#" className="dropbtn">Login</a>
              <div className="dropdown-content">
                <NavLink to="/login/institute">Login as a Institute</NavLink>
                <NavLink to="/login/patient">Login as a Patient</NavLink>
              </div>
            </li>
          )}
        </ul>
      </nav>
      {menuOpen && <div className="overlay" onClick={closeMenu}></div>}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={closeMenu}>×</button>
        <ul className="mobile-nav-links">
          <li>
            <NavLink exact to="/" activeClassName="selected" onClick={closeMenu}>Home</NavLink>
          </li>
          <li>
            <NavLink to="/about" activeClassName="selected" onClick={closeMenu}>About Us</NavLink>
          </li>
          {showProfile ? (
            <li className="profile">
              <span className="nav-title">{userName}</span>
              <img src="/path/to/profile-logo.png" alt="Profile Logo" className="profile-logo" />
            </li>
          ) : (
            <li className="dropdown">
              <a href="#" className="dropbtn">Login</a>
              <div className="dropdown-content">
                <NavLink to="/login/doctor" onClick={closeMenu}>Login as a Institute</NavLink>
                <NavLink to="/login/patient" onClick={closeMenu}>Login as a Patient</NavLink>
              </div>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}

export default Navbar;
