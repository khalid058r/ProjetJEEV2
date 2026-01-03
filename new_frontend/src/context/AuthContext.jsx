import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const storedUser = localStorage.getItem('user')

            if (storedUser && storedUser !== 'undefined') {
                const parsedUser = JSON.parse(storedUser)
                if (parsedUser && parsedUser.id) {
                    setUser(parsedUser)
                    setIsAuthenticated(true)
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            localStorage.removeItem('user')
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password) => {
        try {
            setLoading(true)
            const response = await authApi.login({ email, password })
            // Backend returns user directly: { id, username, email, role, active }
            const userData = response.data

            // Check if account is active
            if (!userData.active) {
                toast.error('Compte non activé. Contactez l\'administrateur.')
                throw new Error('Account not active')
            }

            localStorage.setItem('user', JSON.stringify(userData))

            setUser(userData)
            setIsAuthenticated(true)
            toast.success(`Bienvenue, ${userData.username || userData.email}!`)

            return userData
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Email ou mot de passe incorrect'
            toast.error(message)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const register = async (userData) => {
        try {
            setLoading(true)
            const response = await authApi.register(userData)
            // Les clients ACHETEUR sont automatiquement actifs
            const isClient = userData.role === 'ACHETEUR'
            toast.success(isClient ? 'Compte créé ! Connexion en cours...' : 'Compte créé ! En attente de validation admin.')
            return response.data
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de l\'inscription'
            toast.error(message)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setIsAuthenticated(false)
        toast.success('Déconnexion réussie')
    }

    const updateUser = (userData) => {
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
    }

    const getRoleRedirectPath = (role) => {
        const paths = {
            ADMIN: '/admin',
            VENDEUR: '/vendeur',
            ANALYSTE: '/analyst',
            INVESTISSEUR: '/investor',
            ACHETEUR: '/shop',
        }
        return paths[role] || '/shop'
    }

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        getRoleRedirectPath,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
