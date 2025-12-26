import api from "./axios";

// ============ AUTH API ============

export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (userData) => api.post("/auth/register", userData),
};

// ============ PRODUCTS API ============

export const productsApi = {
  getAll: () => api.get("/products"),
  getById: (id) => api.get(`/products/${id}`),
  getPaginated: (page = 0, size = 10, sortBy = "title") =>
    api.get("/products/page", { params: { page, size, sortBy } }),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ============ CATEGORIES API ============

export const categoriesApi = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  getPaginated: (page = 0, size = 10, sortBy = "name") =>
    api.get("/categories/page", { params: { page, size, sortBy } }),
  getProducts: (id) => api.get(`/categories/${id}/products`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ============ SALES API ============

export const salesApi = {
  getAll: () => api.get("/sales"),
  getById: (id) => api.get(`/sales/${id}`),
  getPaginated: (page = 0, size = 10) =>
    api.get("/sales/page", { params: { page, size } }),
  create: (data) => api.post("/sales", data),
  cancel: (id) => api.post(`/sales/${id}/cancel`),
  delete: (id) => api.delete(`/sales/${id}`),
};

// ============ USERS API ============

export const usersApi = {
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  getPaginated: (page = 0, size = 10, sortBy = "username") =>
    api.get("/users/page", { params: { page, size, sortBy } }),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  activate: (id) => api.patch(`/users/${id}/activate`),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
  delete: (id) => api.delete(`/users/${id}`),
};

// ============ ANALYTICS API ============

export const analyticsApi = {
  // Dashboard & KPIs
  getDashboard: () => api.get("/analytics/dashboard"),
  getKPI: () => api.get("/analytics/kpi"),
  getStatistics: () => api.get("/analytics/statistics"),

  // Sales analytics
  getMonthlySales: () => api.get("/analytics/sales/monthly"),
  getDailySales: (start, end) =>
    api.get("/analytics/sales/daily", { params: { start, end } }),

  // Products analytics
  getBestSellers: (limit = 10) =>
    api.get("/analytics/products/best-sellers", { params: { limit } }),
  getSlowMovers: (maxSold = 5, limit = 10) =>
    api.get("/analytics/products/slow-movers", { params: { maxSold, limit } }),
  getLowStock: (threshold = 5) =>
    api.get("/analytics/products/low-stock", { params: { threshold } }),
  filterProducts: (filters) => api.post("/analytics/products/filter", filters),

  // Category analytics
  getCategoryStats: () => api.get("/analytics/categories"),
  analyzeCategory: (id) => api.get(`/analytics/category/${id}`),

  // Evolution & trends
  getCurrentMonthEvolution: () => api.get("/analytics/evolution/current-month"),
  getBasketStats: () => api.get("/analytics/basket/stats"),

  // Vendeur-specific analytics
  getVendeurKPI: () => api.get("/analytics/vendeur/kpi"),
  getVendeurBestSellers: (limit = 5) =>
    api.get("/analytics/vendeur/products/best-sellers", { params: { limit } }),
  getVendeurDailySales: () => api.get("/analytics/vendeur/sales/daily"),

  // Export
  exportCSV: (filters) =>
    api.post("/analytics/export/csv", filters, { responseType: "blob" }),
};

// ============ ALERTS API ============

export const alertsApi = {
  getAll: () => api.get("/alerts"),
  getUnread: () => api.get("/alerts/unread"),
  getByType: (type) => api.get(`/alerts/type/${type}`),
  getByRole: (role) => api.get(`/alerts/role/${role}`),
  getSummary: () => api.get("/alerts/summary"),

  // Generate alerts
  generateAll: () => api.post("/alerts/generate"),
  generateTop10: () => api.post("/alerts/generate/top10"),
  generateCategories: () => api.post("/alerts/generate/categories"),
  generateStock: () => api.post("/alerts/generate/stock"),

  // Actions
  markAsRead: (id) => api.patch(`/alerts/${id}/read`),
  markAllAsRead: () => api.patch("/alerts/read-all"),
  delete: (id) => api.delete(`/alerts/${id}`),
  deleteOld: (days = 30) => api.delete("/alerts/old", { params: { days } }),
};

// ============ LIGNE VENTE API ============

export const ligneVenteApi = {
  getAll: () => api.get("/ligne-ventes"),
  getById: (id) => api.get(`/ligne-ventes/${id}`),
  getBySaleId: (saleId) => api.get(`/ligne-ventes/sale/${saleId}`),
  create: (data) => api.post("/ligne-ventes", data),
  update: (id, data) => api.put(`/ligne-ventes/${id}`, data),
  delete: (id) => api.delete(`/ligne-ventes/${id}`),
};

export default api;
