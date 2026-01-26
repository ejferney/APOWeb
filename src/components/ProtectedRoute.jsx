import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Hierarchy check: Officers are also Members
    if (requiredRole === 'member' && (user.role === 'member' || user.role === 'officer' || user.role === 'admin')) {
        return children;
    }

    // Strict check for Officer-only routes
    if (requiredRole === 'officer' && (user.role === 'officer' || user.role === 'admin')) {
        return children;
    }

    // Fallback: Access Denied
    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        // Redirect to their appropriate dashboard if they try to access wrong one
        return <Navigate to="/" replace />; // Now all dashboards are at /
    }

    return children;
};

export default ProtectedRoute;
