import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Home from './Home/Home';
import About from './About/About';
import LoginPatient from './Login/LoginPatient';
import PatientRegistration from './Login/PatientRegistration'; 
import User from './User/User';
import PatientProfile from './User/PatientProfile';
import ForgotPassword from './Login/ForgotPassword';
import ResetPassword from './Login/ResetPassword';
import './App.css';
import LoginHospital from './Login/LoginHospital';
import HospitalRegistration from './Login/HospitalRegistration';
import Dashboard from './Hospital/Dashboard';
import InventoryForm from './Hospital/InventoryForm';
import HospitalProfile from './Hospital/HospitalProfile';
import BookAppointment from './Booking/BookAppointment';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import { AdminAuthProvider } from './Admin/AdminAuthContext';
import AdminProtectedRoute from './Admin/AdminProtectedRoute';
import AdminLogin from './Admin/AdminLogin';
import AdminDashboard from './Admin/AdminDashboard';
import AdminForgotPassword from './Admin/AdminForgotPassword';
import AdminResetPassword from './Admin/AdminResetPassword';

// The Home page (with its patient-facing "how to book" walkthrough) should
// only greet logged-out visitors. Once someone's logged in, "/" should
// bounce them straight to whatever their own home base is.
function HomeGate() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user.role === 'hospital') {
    return <Navigate to="/hospital/dashboard" replace />;
  }
  if (isAuthenticated && user.role === 'patient') {
    return <Navigate to="/user" replace />;
  }
  return <Home />;
}

// The admin portal is a deliberately separate interface — no shared
// Navbar, no shared footer, no visual continuity with the rest of the
// site. This just decides whether to show the regular site chrome.
function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomeGate />} />
        <Route path="/about" element={<About />} />
        <Route path="/login/patient" element={<LoginPatient />} />
        <Route path="/register/patient" element={<PatientRegistration />} /> 
        <Route path="/login/hospital" element={<LoginHospital />} /> 
        <Route path="/register/hospital" element={<HospitalRegistration />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/hospital/dashboard"
          element={<ProtectedRoute role="hospital"><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/hospital/inventory/new"
          element={<ProtectedRoute role="hospital"><InventoryForm /></ProtectedRoute>}
        />
        <Route
          path="/hospital/profile"
          element={<ProtectedRoute role="hospital"><HospitalProfile /></ProtectedRoute>}
        />
        <Route
          path="/book-appointment"
          element={<ProtectedRoute role="patient"><BookAppointment /></ProtectedRoute>}
        />
        <Route path="/user" element={<ProtectedRoute role="patient"><User /></ProtectedRoute>} /> 
        <Route path="/patient/profile" element={<ProtectedRoute role="patient"><PatientProfile /></ProtectedRoute>} />

        {/* Admin portal — intentionally not linked from the Navbar anywhere.
            Reachable only by typing the URL directly. */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />
        <Route
          path="/admin/dashboard"
          element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>}
        />
      </Routes>
      {!isAdminRoute && (
        <footer className="footer">
          <p>© 2024 Hospital Management System. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;