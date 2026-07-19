import axios from 'axios';

// Single place for the backend base URL. Set REACT_APP_API_URL in a
// .env file to point at a deployed backend; falls back to local dev.
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API_BASE_URL });

// Attach the auth token (if any) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('hms-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a request comes back 401 (expired/invalid token), the session is
// dead — clear it and bounce to Home instead of leaving the app in a
// broken state where every request silently fails forever.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem('hms-token');
      window.localStorage.removeItem('hms-user');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;