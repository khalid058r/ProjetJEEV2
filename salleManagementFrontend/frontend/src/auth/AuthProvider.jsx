import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

// Role hierarchy for permission checks
const ROLE_HIERARCHY = {
  ADMIN: 4,
  ANALYST: 3,
  INVESTISSEUR: 2,
  VENDEUR: 1,
  ACHETEUR: 0,
};

// Route permissions by role
export const ROLE_ROUTES = {
  ADMIN: ["/dashboard", "/products", "/categories", "/sales", "/users", "/analytics", "/reports", "/alerts", "/settings"],
  VENDEUR: ["/vendeur", "/vendeur/dashboard", "/vendeur/sales", "/vendeur/products", "/vendeur/categories", "/vendeur/analytics", "/vendeur/alerts"],
  ANALYST: ["/analyst", "/analyst/dashboard", "/analyst/workspace", "/analyst/reports", "/analyst/exports", "/analyst/trends"],
  INVESTISSEUR: ["/investor", "/investor/dashboard", "/investor/trends", "/investor/opportunities", "/investor/reports", "/investor/alerts"],
  ACHETEUR: ["/buyer", "/buyer/products", "/buyer/orders"],
};

// Default redirect by role
export const ROLE_DEFAULT_ROUTE = {
  ADMIN: "/dashboard",
  VENDEUR: "/vendeur",
  ANALYST: "/analyst",
  INVESTISSEUR: "/investor",
  ACHETEUR: "/buyer",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const userData = response.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(userData));
      
      toast.success(`Bienvenue, ${userData.username || userData.email}!`);
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || "Échec de connexion";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      toast.success("Inscription réussie! En attente de validation par l'admin.");
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || "Échec de l'inscription";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    toast.success("Déconnexion réussie");
  }, []);

  const hasRole = useCallback((requiredRole) => {
    if (!user?.role) return false;
    return user.role === requiredRole;
  }, [user]);

  const hasAnyRole = useCallback((roles) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user]);

  const hasMinRole = useCallback((minRole) => {
    if (!user?.role) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
  }, [user]);

  const canAccessRoute = useCallback((route) => {
    if (!user?.role) return false;
    const allowedRoutes = ROLE_ROUTES[user.role] || [];
    return allowedRoutes.some(r => route.startsWith(r));
  }, [user]);

  const getDefaultRoute = useCallback(() => {
    if (!user?.role) return "/login";
    return ROLE_DEFAULT_ROUTE[user.role] || "/";
  }, [user]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    hasRole,
    hasAnyRole,
    hasMinRole,
    canAccessRoute,
    getDefaultRoute,
    role: user?.role || null,
    userId: user?.id || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
