import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, isLoadingAuth } = useAuth();

    // While auth is loading, show nothing (prevents flash of Home)
    if (isLoadingAuth) {
        return <div style={{ display: 'none' }} />;
    }

    if (!user) {
        // Redirect to login if user is not authenticated
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;