// ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  // While user info is loading, show nothing or a loader
  if (loading) {
    return <div>Loading...</div>; // or a spinner component
  }

  // Not authenticated → redirect to register
  if (!user || !token) {
    return <Navigate to="/register" state={{ from: location }} replace />;
  }

  // Authenticated → allow access
  return <>{children}</>;
};

export default ProtectedRoute;
