import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
})

// Request interceptor - Add user headers for authenticated requests
api.interceptors.request.use(
    (config) => {
        const userStr = localStorage.getItem('user')
        if (userStr && userStr !== 'undefined') {
            try {
                const user = JSON.parse(userStr)
                if (user && user.id) {
                    // Add user headers required by backend for sales, etc.
                    config.headers['X-User-Id'] = user.id
                    config.headers['X-User-Role'] = user.role
                }
            } catch (e) {
                console.error('Error parsing user from localStorage:', e)
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message || 'Une erreur est survenue'

        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
            toast.error('Session expirée. Veuillez vous reconnecter.')
        } else if (error.response?.status === 403) {
            toast.error('Accès non autorisé')
        } else if (error.response?.status === 404) {
            // Don't show toast for 404, handle in component
        } else if (error.response?.status >= 500) {
            // Only show error toast if not a silent/expected failure
            // Dashboard API calls are expected to sometimes fail during initial load
            const isSilentEndpoint = ['/sales', '/analytics'].some(ep =>
                error.config?.url?.includes(ep)
            )
            if (!isSilentEndpoint) {
                toast.error('Erreur serveur. Veuillez réessayer.')
            }
        }

        return Promise.reject(error)
    }
)

export default api
