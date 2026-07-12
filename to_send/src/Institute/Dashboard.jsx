import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setProfileOpen(!profileOpen);
  };

  const closeProfileMenu = () => {
    setProfileOpen(false);
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-navbar">
        <img alt="Logo" className="logo" />
        <a href="/" className="nav-title">HOSPITAL MANAGEMENT SYSTEM</a>
        <button className="menu-btn" onClick={toggleMenu}>
          ☰
        </button>
        <ul className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          <li>
            <NavLink to="/inventory" activeClassName="selected">Inventory</NavLink>
          </li>
          <li>
            <NavLink to="/add-inventory" activeClassName="selected">Add to Inventory</NavLink>
          </li>
          <li className="profile-menu">
            <button onClick={toggleProfileMenu} className="profile-btn">
              Profile
            </button>
            {profileOpen && (
              <div className="dropdown-content">
                <NavLink to="/profile" onClick={closeProfileMenu}>Profile</NavLink>
                <NavLink to="/logout" onClick={closeProfileMenu}>Logout</NavLink>
              </div>
            )}
          </li>
        </ul>
      </nav>
      {menuOpen && <div className="overlay" onClick={closeMenu}></div>}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={closeMenu}>×</button>
        <ul className="mobile-nav-links">
          <li>
            <NavLink to="/inventory" activeClassName="selected" onClick={closeMenu}>Inventory</NavLink>
          </li>
          <li>
            <NavLink to="/add-inventory" activeClassName="selected" onClick={closeMenu}>Add to Inventory</NavLink>
          </li>
          <li>
            <button onClick={toggleProfileMenu} className="profile-btn">
              Profile
            </button>
            {profileOpen && (
              <div className="dropdown-content">
                <NavLink to="/profile" onClick={closeProfileMenu}>Profile</NavLink>
                <NavLink to="/logout" onClick={closeProfileMenu}>Logout</NavLink>
              </div>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
