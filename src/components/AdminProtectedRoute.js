import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAuthToken, getRole, decodeJwt, STORAGE_KEYS } from '../axios_helper';

const AdminProtectedRoute = () => {
  const location = useLocation();
  const token = getAuthToken(STORAGE_KEYS.ADMIN);
  const role = getRole(STORAGE_KEYS.ADMIN);

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // Defense in depth: enforce the role at the route level too.
  if (role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }

  // Soft check on expiry (server is the source of truth)
  const decoded = decodeJwt(token);
  if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
