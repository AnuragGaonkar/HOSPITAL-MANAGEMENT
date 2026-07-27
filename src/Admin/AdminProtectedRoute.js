import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';

// Separate from src/auth/ProtectedRoute.js on purpose — redirects to
// /admin/login, never to the patient/hospital login pages, and checks
// admin auth state only.
export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}