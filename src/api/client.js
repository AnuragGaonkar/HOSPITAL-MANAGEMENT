import axios from 'axios';

// Single place for the backend base URL. Set REACT_APP_API_URL in a
// .env file to point at a deployed backend; falls back to local dev.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API_BASE_URL });

// Attach the auth token (if any) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('hms-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;