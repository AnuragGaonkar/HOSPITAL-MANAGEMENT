import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home/Home';
import About from './About/About';
import LoginPatient from './Login/LoginPatient';
import PatientRegistration from './Login/PatientRegistration'; 
import User from './User/User';
import './App.css';
import LoginHospital from './Login/LoginHospital';
import HospitalRegistration from './Login/HospitalRegistration';
import Dashboard from './Hospital/Dashboard';
import InventoryForm from './Hospital/InventoryForm';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login/patient" element={<LoginPatient />} />
            <Route path="/register/patient" element={<PatientRegistration />} /> 
            <Route path="/login/hospital" element={<LoginHospital />} /> 
            <Route path="/register/hospital" element={<HospitalRegistration />} />
            <Route
              path="/hospital/dashboard"
              element={<ProtectedRoute role="hospital"><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/hospital/inventory/new"
              element={<ProtectedRoute role="hospital"><InventoryForm /></ProtectedRoute>}
            />
            <Route path="/user" element={<ProtectedRoute role="patient"><User /></ProtectedRoute>} /> 
          </Routes>
          <footer className="footer">
            <p>© 2024 Hospital Management System. All rights reserved.</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;