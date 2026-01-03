import api from './axios'

/**
 * API pour le panier client
 */
export const cartApi = {
    // Récupérer le panier
    getCart: () => api.get('/cart'),

    // Ajouter un produit
    addToCart: (productId, quantity = 1) =>
        api.post('/cart/items', { productId, quantity }),

    // Modifier la quantité
    updateCartItem: (itemId, quantity) =>
        api.put(`/cart/items/${itemId}`, { quantity }),

    // Supprimer un article
    removeFromCart: (itemId) => api.delete(`/cart/items/${itemId}`),

    // Vider le panier
    clearCart: () => api.delete('/cart'),
}

export default cartApi
