import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const LOGIN_PATH_BY_ROLE = {
  hospital: '/login/hospital',
  patient: '/login/patient',
};

export default function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const loginPath = LOGIN_PATH_BY_ROLE[role] || '/login/patient';
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}