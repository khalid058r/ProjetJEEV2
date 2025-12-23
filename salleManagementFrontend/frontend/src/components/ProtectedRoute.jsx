// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si allowedRoles fourni, check role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  // Sinon accès accordé
  return children;
}