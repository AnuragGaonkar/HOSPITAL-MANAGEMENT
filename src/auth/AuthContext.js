import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'hms-token';
const USER_KEY = 'hms-user';

function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Wrap the app in <AuthProvider> once (done in App.js). Any component
// can then call useAuth() to read who's logged in, or to log in/out.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  // `data` shape: { token, role: 'patient' | 'hospital', name }
  const login = useCallback((data) => {
    const nextUser = { role: data.role, name: data.name || data.fullName, id: data.id };
    window.localStorage.setItem(TOKEN_KEY, data.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}