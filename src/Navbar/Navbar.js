import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import logo from './logo.png';
import useTheme from '../theme/useTheme';
import EmergencyButton from '../Emergency/EmergencyButton';
import { useAuth } from '../auth/AuthContext';
import './Navbar.css';

// "Book Appointment" is added dynamically below — only shown to
// logged-in patients, so it's not in this static list.
const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About Us', end: false },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navItems = isAuthenticated && user.role === 'patient'
    ? [...NAV_ITEMS, { to: '/book-appointment', label: 'Book Appointment', end: false }]
    : NAV_ITEMS;
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const linkClass = ({ isActive }) => (isActive ? 'selected' : '');

  // "Home" redirects logged-in users to their own landing page (patients
  // land on /user, hospitals on /hospital/dashboard — see HomeGate in
  // App.js), so NavLink's own path-matching never marks it active once
  // you're there. This treats those landing pages as "Home" too.
  const isHomeActive = (item) => {
    if (item.to !== '/') return undefined; // let NavLink handle every other item normally
    if (location.pathname === '/') return true;
    if (isAuthenticated && user.role === 'patient' && location.pathname === '/user') return true;
    if (isAuthenticated && user.role === 'hospital' && location.pathname.startsWith('/hospital/dashboard')) return true;
    return false;
  };

  const homeAwareClass = (item) => {
    const forced = isHomeActive(item);
    if (forced === undefined) return linkClass;
    return forced ? 'selected' : '';
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  const ThemeToggle = ({ className = '' }) => (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className={`theme-toggle-icon ${theme}`} aria-hidden="true">
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
    </button>
  );

  const AuthLinks = ({ onNavigate }) =>
    isAuthenticated ? (
      <li className="dropdown">
        <button type="button" className="dropbtn profile-dropbtn">
          <span className="profile-avatar" aria-hidden="true">
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </span>
          <span className="nav-username">{user.name}</span>
          <span className="dropbtn-caret">▾</span>
        </button>
        <div className="dropdown-content">
          {user.role === 'patient' && (
            <NavLink to="/patient/profile" onClick={onNavigate}>My Profile</NavLink>
          )}
          <button type="button" className="dropdown-logout" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </li>
    ) : (
      <li className="dropdown">
        <button type="button" className="dropbtn">
          Login
          <span className="dropbtn-caret">▾</span>
        </button>
        <div className="dropdown-content">
          <NavLink to="/login/hospital" onClick={onNavigate}>Login as a Hospital</NavLink>
          <NavLink to="/login/patient" onClick={onNavigate}>Login as a Patient</NavLink>
        </div>
      </li>
    );

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <a href="/" className="brand">
          <img src={logo} alt="Hospital Management System logo" className="logo" />
          <span className="nav-title">Hospital Management System</span>
        </a>

        <div className="navbar-right">
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={homeAwareClass(item)}>
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li><ThemeToggle /></li>
            <AuthLinks />
          </ul>

          <button
            className="menu-btn"
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={`hamburger ${menuOpen ? 'is-open' : ''}`} />
          </button>
        </div>
      </nav>

      <div className={`overlay ${menuOpen ? 'overlay-open' : ''}`} onClick={closeMenu} />

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-header">
          <ThemeToggle className="theme-toggle-mobile" />
          <button className="close-btn" onClick={closeMenu} aria-label="Close menu">×</button>
        </div>
        <ul className="mobile-nav-links">
          {navItems.map((item, i) => (
            <li key={item.to} style={{ transitionDelay: `${i * 40}ms` }}>
              <NavLink to={item.to} end={item.end} className={homeAwareClass(item)} onClick={closeMenu}>
                {item.label}
              </NavLink>
            </li>
          ))}
          <AuthLinks onNavigate={closeMenu} />
        </ul>
      </div>

      {/* Mobile-only floating SOS control — hidden via CSS above the mobile breakpoint */}
      <EmergencyButton />
    </>
  );
}

export default Navbar;