// src/components/LoginPatient/LoginPatient.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPatient.css';
import Navbar from '../Navbar/Navbar';

function LoginPatient() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:5000/login/patient',
        { email, password }
      );      
      localStorage.setItem('token', response.data.token); // Store token
      alert('Login successful!');
      navigate('/user', { state: { name: response.data.fullName } });
    } catch (err) {
      console.error('Error during login:', err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleRegister = () => {
    navigate('/register/patient');
  };

  return (
    <>
      <Navbar />
      <div className="login-container">
        <div className="login-toggle">
          <button
            onClick={() => {
              setIsLogin(true);
              navigate('/login/patient');
            }}
            className={isLogin ? 'active' : ''}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              handleRegister();
            }}
            className={!isLogin ? 'active' : ''}
          >
            Register
          </button>
        </div>
        {isLogin ? (
          <div className="login-form">
            <h2>Login as Patient</h2>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {error && <p className="error-message">{error}</p>}
            </form>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default LoginPatient;
