import axios from 'axios';

// Deliberately separate from src/api/client.js — different localStorage
// keys, different axios instance entirely. A patient or hospital
// session token is never read here, and an admin token is never read
// by the regular client. Neither can accidentally authenticate as the
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const adminApi = axios.create({ baseURL: API_BASE_URL });

adminApi.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('hms-admin-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem('hms-admin-token');
      window.localStorage.removeItem('hms-admin-user');
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;