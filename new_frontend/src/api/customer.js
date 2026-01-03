import api from './axios'

/**
 * API pour le profil client et fidélité
 */
export const customerApi = {
    // Profil
    getProfile: () => api.get('/customer/profile'),
    updateProfile: (data) => api.put('/customer/profile', data),

    // Fidélité
    getLoyaltyInfo: () => api.get('/customer/loyalty'),
}

export default customerApi
