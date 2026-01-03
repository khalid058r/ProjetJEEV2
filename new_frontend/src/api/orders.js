import api from './axios'

/**
 * API pour les commandes Click & Collect
 */
export const ordersApi = {
    // ============ CLIENT ============

    // Créer une commande (POST /api/orders)
    createOrder: (notes = '') => api.post('/orders', { notes }),

    // Historique des commandes (GET /api/orders/history)
    getMyOrders: () => api.get('/orders/history'),

    // Détail d'une commande (GET /api/orders/{id})
    getOrderById: (id) => api.get(`/orders/${id}`),

    // Annuler une commande (POST /api/orders/{id}/cancel)
    cancelOrder: (id) => api.post(`/orders/${id}/cancel`),

    // Vérifier par code de retrait
    getOrderByPickupCode: (code) => api.get(`/orders/pickup/${code}`),

    // ============ VENDEUR ============

    // Commandes en attente (GET /api/orders/pending)
    getPendingOrders: () => api.get('/orders/pending'),

    // Toutes les commandes Click & Collect (GET /api/orders/all)
    getAllOrders: () => api.get('/orders/all'),

    // Confirmer une commande (POST /api/orders/{id}/confirm)
    confirmOrder: (id) => api.post(`/orders/${id}/confirm`),

    // Mettre en préparation (POST /api/orders/{id}/process)
    processOrder: (id) => api.post(`/orders/${id}/process`),

    // Marquer comme prête (POST /api/orders/{id}/ready)
    markOrderReady: (id) => api.post(`/orders/${id}/ready`),

    // Marquer comme récupérée (POST /api/orders/{id}/complete)
    markOrderComplete: (id) => api.post(`/orders/${id}/complete`),

    // Rejeter une commande (POST /api/orders/{id}/reject)
    rejectOrder: (id, reason) => api.post(`/orders/${id}/reject`, { reason }),
}

export default ordersApi
