import axios from "axios";
import toast from "react-hot-toast";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth headers
api.interceptors.request.use(
  (config) => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.id) {
          config.headers["X-User-Id"] = user.id;
        }
        if (user?.role) {
          config.headers["X-User-Role"] = user.role;
        }
      }
    } catch (error) {
      console.error("Failed to parse user for request headers:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    // Network error
    if (!response) {
      toast.error("Erreur réseau. Vérifiez votre connexion.");
      return Promise.reject(error);
    }

    const { status, data } = response;

    switch (status) {
      case 400:
        // Bad request - show specific error if available
        toast.error(data?.message || "Requête invalide");
        break;

      case 401:
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem("user");
        toast.error("Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/login";
        break;

      case 403:
        // Forbidden - access denied
        toast.error("Accès non autorisé");
        break;

      case 404:
        // Not found
        toast.error(data?.message || "Ressource non trouvée");
        break;

      case 409:
        // Conflict
        toast.error(data?.message || "Conflit de données");
        break;

      case 422:
        // Validation error
        const validationErrors = data?.errors;
        if (validationErrors && Array.isArray(validationErrors)) {
          validationErrors.forEach((err) => toast.error(err));
        } else {
          toast.error(data?.message || "Erreur de validation");
        }
        break;

      case 500:
        // Server error
        toast.error("Erreur serveur. Réessayez plus tard.");
        break;

      default:
        toast.error(data?.message || "Une erreur s'est produite");
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper functions for common request types
export const apiGet = (url, config = {}) => api.get(url, config);
export const apiPost = (url, data, config = {}) => api.post(url, data, config);
export const apiPut = (url, data, config = {}) => api.put(url, data, config);
export const apiPatch = (url, data, config = {}) => api.patch(url, data, config);
export const apiDelete = (url, config = {}) => api.delete(url, config);
