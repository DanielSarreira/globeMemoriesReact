import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute = () => {
  // Verificar se há token de admin no localStorage
  const adminToken = localStorage.getItem('adminToken');
  const isLoadingAuth = localStorage.getItem('isLoadingAuth') === 'true';

  // Enquanto carrega, não renderiza nada
  if (isLoadingAuth) {
    return null;
  }

  return adminToken ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminProtectedRoute;
