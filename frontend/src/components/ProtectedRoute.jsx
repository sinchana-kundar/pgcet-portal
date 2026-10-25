import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context';
import Loader from './Loader';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader message="Verifying authentication..." fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Students who try to open /admin must be redirected away
    const destination = user?.role === 'student' ? '/dashboard' : '/';
    return <Navigate to={destination} replace />;
  }


  return children;
}
