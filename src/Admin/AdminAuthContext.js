import React, { createContext, useContext, useState, useCallback } from 'react';

const AdminAuthContext = createContext(null);

const TOKEN_KEY = 'hms-admin-token';
const USER_KEY = 'hms-admin-user';

function readStoredAdmin() {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Completely separate from src/auth/AuthContext.js on purpose — own
// storage keys, own provider. A patient/hospital login never touches
// this, and this never touches theirs.
export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(readStoredAdmin);

  const login = useCallback((data) => {
    const nextAdmin = { name: data.name, id: data.id };
    window.localStorage.setItem(TOKEN_KEY, data.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextAdmin));
    setAdmin(nextAdmin);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setAdmin(null);
  }, []);

  const value = { admin, isAuthenticated: !!admin, login, logout };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return ctx;
}