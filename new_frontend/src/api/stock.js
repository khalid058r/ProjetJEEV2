import api from './axios'



export const stockApi = {

    getDashboard: () => api.get('/stock/dashboard'),


    getLowStockProducts: () => api.get('/stock/low'),


    getOutOfStockProducts: () => api.get('/stock/out'),


    getStockMovements: (params = {}) => api.get('/stock/movements', { params }),

    addStock: (productId, quantity, supplier = '', notes = '') =>
        api.post('/stock/add', { productId, quantity, supplier, notes }),


    adjustStock: (productId, newQuantity, reason = '') =>
        api.post('/stock/adjust', { productId, newQuantity, reason }),

    addProductStock: (productId, quantity, supplier = '', notes = '') =>
        api.post(`/products/${productId}/stock/add`, { quantity, supplier, notes }),


    adjustProductStock: (productId, newQuantity, reason = '') =>
        api.post(`/products/${productId}/stock/adjust`, { newQuantity, reason }),

    getAvailableStock: (product) => {
        const stock = product?.stock || 0
        const reserved = product?.reservedStock || 0
        return Math.max(0, stock - reserved)
    },

    isLowStock: (product, threshold = 10) => {
        const available = stockApi.getAvailableStock(product)
        return available > 0 && available <= threshold
    },

    isOutOfStock: (product) => {
        return stockApi.getAvailableStock(product) <= 0
    }
}

export default stockApi
