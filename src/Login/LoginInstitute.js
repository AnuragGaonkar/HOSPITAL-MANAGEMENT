import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginInstitute.css';
import Navbar from '../Navbar/Navbar';
import axios from 'axios';

function LoginInstitute() {
  const [instituteId, setInstituteId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/login/institute', {
        instituteId,
        password,
      });

      // Store the token in local storage or context
      localStorage.setItem('token', response.data.token);

      // Redirect after login with state
      navigate('/inventory', { state: { name: response.data.name } });
    } catch (error) {
      console.error('Error logging in:', error.response ? error.response.data : error);
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-container">
        <div className="login-form">
          <h2>Login as Institute</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Institute ID"
              value={instituteId}
              onChange={(e) => setInstituteId(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default LoginInstitute;
