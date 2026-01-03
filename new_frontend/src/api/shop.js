import api from './axios'

/**
 * API pour le catalogue boutique (Click & Collect)
 */
export const shopApi = {
    // Produits
    getProducts: (params = {}) => api.get('/shop/products', { params }),
    getProductById: (id) => api.get(`/shop/products/${id}`),
    getProductsByCategory: (categoryId, params = {}) =>
        api.get('/shop/products', { params: { ...params, categoryId } }),
    searchProducts: (query, params = {}) =>
        api.get('/shop/products', { params: { ...params, search: query } }),

    // Catégories
    getCategories: () => api.get('/shop/categories'),
    getCategoryById: (id) => api.get(`/shop/categories/${id}`),
}

export default shopApi
