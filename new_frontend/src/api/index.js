import api from './axios'

export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
    refreshToken: () => api.post('/auth/refresh'),
}

export const productApi = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    search: (query) => api.get('/products/search', { params: { q: query } }),
    getByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
    getLowStock: () => api.get('/products/low-stock'),
    getTopSelling: (limit = 10) => api.get('/products/top-selling', { params: { limit } }),
}

export const categoryApi = {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
    getStats: (id) => api.get(`/categories/${id}/stats`),
}

export const saleApi = {
    getAll: (params) => api.get('/sales', { params }),
    getById: (id) => api.get(`/sales/${id}`),
    create: (data) => api.post('/sales', data),
    update: (id, data) => api.put(`/sales/${id}`, data),
    delete: (id) => api.delete(`/sales/${id}`),
    cancel: (id) => api.post(`/sales/${id}/cancel`),
    getByDateRange: (startDate, endDate) =>
        api.get('/sales/range', { params: { startDate, endDate } }),
    getRecent: (limit = 10) => api.get('/sales/recent', { params: { limit } }),
    getStats: () => api.get('/sales/stats'),
}

export const userApi = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
    getByRole: (role) => api.get('/users/role', { params: { role } }),
    activate: (id) => api.patch(`/users/${id}/activate`),
    deactivate: (id) => api.patch(`/users/${id}/deactivate`),
    getPaginated: (page = 0, size = 10, sortBy = 'username') =>
        api.get('/users/page', { params: { page, size, sortBy } }),
}

export const analyticsApi = {
    getDashboard: () => api.get('/analytics/dashboard'),
    getKPI: () => api.get('/analytics/kpi'),
    getSalesAnalytics: (period) => api.get('/analytics/sales', { params: { period } }),
    getProductAnalytics: () => api.get('/analytics/products'),
    getCategoryAnalytics: () => api.get('/analytics/categories'),
    getRevenueAnalytics: (period) => api.get('/analytics/revenue', { params: { period } }),
    getTrends: () => api.get('/analytics/trends'),
    getAlerts: () => api.get('/analytics/alerts'),
    // New analytics endpoints
    getStatistics: () => api.get('/analytics/statistics'),
    getMonthlySales: () => api.get('/analytics/sales/monthly'),
    getDailySales: (start, end) => api.get('/analytics/sales/daily', { params: { start, end } }),
    getBestSellers: (limit = 10) => api.get('/analytics/products/best-sellers', { params: { limit } }),
    getSlowMovers: (maxSold = 5, limit = 10) => api.get('/analytics/products/slow-movers', { params: { maxSold, limit } }),
    getLowStockProducts: (threshold = 5) => api.get('/analytics/products/low-stock', { params: { threshold } }),
    getCategoryStats: () => api.get('/analytics/categories'),
    getCurrentMonthEvolution: () => api.get('/analytics/evolution/current-month'),
    getBasketStats: () => api.get('/analytics/basket/stats'),
    filterProducts: (filterRequest) => api.post('/analytics/products/filter', filterRequest),
    exportCSV: (filterRequest) => api.post('/analytics/export/csv', filterRequest, { responseType: 'blob' }),
    analyzeCategory: (id) => api.get(`/analytics/category/${id}`),
    // Vendeur specific
    getVendeurKPI: () => api.get('/analytics/vendeur/kpi'),
    getVendeurBestSellers: (limit = 5) => api.get('/analytics/vendeur/products/best-sellers', { params: { limit } }),
    getVendeurDailySales: () => api.get('/analytics/vendeur/sales/daily'),
}

export default {
    auth: authApi,
    products: productApi,
    categories: categoryApi,
    sales: saleApi,
    users: userApi,
    analytics: analyticsApi,
}
