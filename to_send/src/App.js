import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home/Home';
import About from './About/About';
import LoginPatient from './Login/LoginPatient';
import PatientRegistration from './Login/PatientRegistration'; 
import User from './User/User';
import './App.css';
import LoginInstitute from './Login/LoginInstitute';
import Dashboard from './Institute/Dashboard';
import InventoryForm from './Institute/InventoryForm';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login/patient" element={<LoginPatient />} />
          <Route path="/register/patient" element={<PatientRegistration />} /> 
          <Route path="/login/institute" element={<LoginInstitute />} /> 
          <Route path="/inventory" element={<Dashboard />} /> 
          <Route path="/inventory-form" element={<InventoryForm />} /> 
          <Route path="/user" element={<User />} /> 
        </Routes>
        <footer className="footer">
          <p>© 2024 Hospital Management System. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
