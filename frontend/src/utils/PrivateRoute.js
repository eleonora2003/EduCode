// src/utils/PrivateRoute.js
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export default function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}