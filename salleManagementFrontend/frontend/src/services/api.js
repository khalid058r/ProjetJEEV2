import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api", // adapte si besoin
});

// Ajouter automatiquement le token si nécessaire plus tard
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      config.headers["X-User-Id"] = user.id;
      config.headers["X-User-Role"] = user.role;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
export default api;
