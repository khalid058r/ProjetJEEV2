import api from './axios'
import { stockApi } from './stock'

// Shop & Client APIs
export { shopApi } from './shop'
export { cartApi } from './cart'
export { ordersApi } from './orders'
export { customerApi } from './customer'
// export { stockApi } from './stock' // Removed to avoid conflict, we export it below via named export of imported var if needed

export { stockApi }

export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
    refreshToken: () => api.post('/auth/refresh'),
}

export const productApi = {
    getAll: (params) => api.get('/products', { params }),
    getId: (id) => api.get(`/products/${id}`),
    getById: (id) => api.get(`/products/${id}`),  // Alias pour compatibilité
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    search: (query) => api.get('/products/search', { params: { q: query } }),
    getByCategory: (categoryId) => api.get(`/categories/${categoryId}/products`),
    // Redirection vers Analytics API pour la consistance des données
    getLowStock: () => api.get('/analytics/products/low-stock'),
    getTopSelling: (limit = 10) => api.get('/analytics/products/best-sellers', { params: { limit } }),
    import: (formData) => api.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
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

    // Exports
    exportCSV: (filterData) => api.post('/analytics/export/csv', filterData, {
        responseType: 'blob'
    }),
    exportPDF: (filterData) => api.post('/analytics/export/pdf', filterData, {
        responseType: 'blob'
    }),

    // Detailed Reports
    exportSalesPDF: (filterData) => api.post('/analytics/export/pdf/sales', filterData, { responseType: 'blob' }),
    exportProductsPDF: (filterData) => api.post('/analytics/export/pdf/products', filterData, { responseType: 'blob' }),
    exportUsersPDF: () => api.get('/analytics/export/pdf/users', { responseType: 'blob' }),
    exportInventoryPDF: () => api.get('/analytics/export/pdf/inventory', { responseType: 'blob' }),
    exportSellersPDF: (filterData) => api.post('/analytics/export/pdf/sellers', filterData, { responseType: 'blob' })
}

// ===================================================
// ML API - Machine Learning (via Java Backend → Python ML Service)
// ===================================================
export const mlApi = {
    // Prédictions ML
    predictPrice: (productData) => api.post('/ml/predict/price', productData),
    predictDemand: (productData) => api.post('/ml/predict/demand', productData),
    predictBestseller: (productData) => api.post('/ml/predict/bestseller', productData),

    // Prédictions par ID produit
    predictPriceById: (productId) => api.post(`/ml/predict/price/${productId}`),
    predictDemandById: (productId) => api.post(`/ml/predict/demand/${productId}`),
    predictBestsellerById: (productId) => api.post(`/ml/predict/bestseller/${productId}`),

    // Analyse complète
    analyzeProduct: (productId) => api.get(`/ml/analyze/${productId}`),

    // Santé du service ML
    getHealth: () => api.get('/ml/health'),
}

// ===================================================
// RECOMMENDATIONS API - Recommandations de produits
// ===================================================
export const recommendationsApi = {
    // Produits similaires
    getSimilar: (productId, limit = 5) => api.get(`/recommendations/similar/${productId}`, { params: { limit } }),

    // Up-sell - Produits premium
    getUpsell: (productId, limit = 5) => api.get(`/recommendations/upsell/${productId}`, { params: { limit } }),

    // Cross-sell - Produits complémentaires
    getCrossSell: (productId, limit = 5) => api.get(`/recommendations/crosssell/${productId}`, { params: { limit } }),

    // Toutes les recommandations
    getAll: (productId, limit = 5) => api.get(`/recommendations/product/${productId}`, { params: { limit } }),
}

// ===================================================
// SEARCH API - Recherche sémantique (via Python ML Service)
// ===================================================
const PYTHON_ML_URL = 'http://localhost:5000'

export const searchApi = {
    // Recherche sémantique
    semantic: (query, topK = 10) =>
        fetch(`${PYTHON_ML_URL}/api/ml/v2/search?query=${encodeURIComponent(query)}&top_k=${topK}`)
            .then(res => res.json()),

    // Produits similaires par embedding
    findSimilar: (productId, topK = 5) =>
        fetch(`${PYTHON_ML_URL}/api/ml/v2/similar/${productId}?top_k=${topK}`)
            .then(res => res.json()),
}

// ===================================================
// ETL API - Import/Export de données
// ===================================================
export const etlApi = {
    // Upload et import CSV
    uploadCSV: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return fetch(`${PYTHON_ML_URL}/api/etl/upload`, {
            method: 'POST',
            body: formData
        }).then(res => res.json())
    },

    // Validation de fichier
    validateFile: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return fetch(`${PYTHON_ML_URL}/api/etl/validate`, {
            method: 'POST',
            body: formData
        }).then(res => res.json())
    },

    // Traitement et import vers Java
    processAndImport: (file, options = {}) => {
        const formData = new FormData()
        formData.append('file', file)
        Object.keys(options).forEach(key => formData.append(key, options[key]))
        return fetch(`${PYTHON_ML_URL}/api/etl/process-and-import`, {
            method: 'POST',
            body: formData
        }).then(res => res.json())
    },

    // Statut des jobs
    getJobStatus: (jobId) =>
        fetch(`${PYTHON_ML_URL}/api/etl/jobs/${jobId}`).then(res => res.json()),

    // Liste des jobs
    listJobs: () =>
        fetch(`${PYTHON_ML_URL}/api/etl/jobs`).then(res => res.json()),
}

export default {
    auth: authApi,
    products: productApi,
    categories: categoryApi,
    sales: saleApi,
    users: userApi,
    analytics: analyticsApi,
    stock: stockApi,
    ml: mlApi,
    recommendations: recommendationsApi,
    search: searchApi,
    etl: etlApi,
}
