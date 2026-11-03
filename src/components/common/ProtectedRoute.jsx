import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRole, allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    // Unauthenticated -> redirect to login with query param next and state message
    const nextPath = location.pathname + location.search;
    const isNgoReg = nextPath.startsWith('/ngo/registration');
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(nextPath)}`}
        state={{
          from: location,
          message: isNgoReg
            ? 'Please sign in with your Village/Sanstha account to continue your NGO registration application.'
            : 'Please sign in to access this page.',
        }}
        replace
      />
    );
  }

  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch (e) {
    localStorage.clear();
    const nextPath = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(nextPath)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  const role = user?.role?.toUpperCase();

  const authorizedRoles = allowedRoles
    ? allowedRoles.map((r) => r.toUpperCase())
    : Array.isArray(allowedRole)
    ? allowedRole.map((r) => r.toUpperCase())
    : allowedRole
    ? allowedRole.split(',').map((r) => r.trim().toUpperCase())
    : null;

  if (authorizedRoles && !authorizedRoles.includes(role)) {
    // Role mismatch -> redirect to authorized portal
    if (role === 'DONOR') return <Navigate to="/donor/dashboard" replace />;
    if (role === 'NGO') return <Navigate to="/ngo/dashboard" replace />;
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'COMPANY') return <Navigate to="/company/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
