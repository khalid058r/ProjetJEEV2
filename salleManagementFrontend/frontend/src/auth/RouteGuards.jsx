import { Navigate, useLocation } from "react-router-dom";
import { useAuth, ROLE_ROUTES, ROLE_DEFAULT_ROUTE } from "./AuthProvider";
import LoadingScreen from "../components/common/LoadingScreen";

// Protected route wrapper - requires authentication
export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Role-based route guard
export function RequireRole({ children, roles, fallback = null }) {
  const { isAuthenticated, isLoading, user, hasAnyRole, getDefaultRoute } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!hasAnyRole(allowedRoles)) {
    // If fallback provided, render it
    if (fallback) return fallback;
    
    // Otherwise redirect to user's default route
    return <Navigate to={getDefaultRoute()} replace />;
  }

  return children;
}

// Route guard for specific routes based on role permissions
export function RouteGuard({ children }) {
  const { isAuthenticated, isLoading, user, canAccessRoute, getDefaultRoute } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user can access current route
  if (!canAccessRoute(location.pathname)) {
    return <Navigate to={getDefaultRoute()} replace />;
  }

  return children;
}

// Redirect authenticated users away from auth pages (login, register)
export function GuestOnly({ children }) {
  const { isAuthenticated, isLoading, getDefaultRoute } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultRoute()} replace />;
  }

  return children;
}

// Access denied component
export function AccessDenied({ message = "Vous n'avez pas la permission d'accéder à cette page." }) {
  const { getDefaultRoute } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Accès Refusé
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <a
          href={getDefaultRoute()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}

export default RequireAuth;
