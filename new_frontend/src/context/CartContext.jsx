import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cartApi } from '../api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
    const { user, isAuthenticated } = useAuth()
    const [cart, setCart] = useState({ items: [], totalAmount: 0, totalItems: 0 })
    const [loading, setLoading] = useState(false)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    // Vérifier si l'utilisateur est un client (ACHETEUR)
    const isCustomer = user?.role === 'ACHETEUR'

    // Charger le panier
    const fetchCart = useCallback(async () => {
        if (!isAuthenticated || !isCustomer) return

        try {
            setLoading(true)
            const response = await cartApi.getCart()
            setCart(response.data)
        } catch (error) {
            console.error('Erreur chargement panier:', error)
            // Ne pas afficher d'erreur si le panier est vide
            if (error.response?.status !== 404) {
                setCart({ items: [], totalAmount: 0, totalItems: 0 })
            }
        } finally {
            setLoading(false)
        }
    }, [isAuthenticated, isCustomer])

    useEffect(() => {
        fetchCart()
    }, [fetchCart])

    // Ajouter au panier
    const addToCart = async (productId, quantity = 1) => {
        if (!isAuthenticated) {
            toast.error('Veuillez vous connecter pour ajouter au panier')
            return { success: false, error: 'Non authentifié' }
        }

        try {
            setLoading(true)
            const response = await cartApi.addToCart(productId, quantity)
            setCart(response.data)
            setIsDrawerOpen(true) // Ouvrir le drawer
            toast.success('Produit ajouté au panier !')
            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de l\'ajout'
            toast.error(message)
            return { success: false, error: message }
        } finally {
            setLoading(false)
        }
    }

    // Modifier la quantité
    const updateQuantity = async (itemId, quantity) => {
        try {
            setLoading(true)
            const response = await cartApi.updateCartItem(itemId, quantity)
            setCart(response.data)
            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de la modification'
            toast.error(message)
            return { success: false, error: message }
        } finally {
            setLoading(false)
        }
    }

    // Supprimer un article
    const removeItem = async (itemId) => {
        try {
            setLoading(true)
            const response = await cartApi.removeFromCart(itemId)
            setCart(response.data)
            toast.success('Article supprimé')
            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de la suppression'
            toast.error(message)
            return { success: false, error: message }
        } finally {
            setLoading(false)
        }
    }

    // Vider le panier
    const clearCart = async () => {
        try {
            setLoading(true)
            await cartApi.clearCart()
            setCart({ items: [], totalAmount: 0, totalItems: 0 })
            toast.success('Panier vidé')
            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors du vidage'
            toast.error(message)
            return { success: false, error: message }
        } finally {
            setLoading(false)
        }
    }

    // Reset panier (après commande)
    const resetCart = () => {
        setCart({ items: [], totalAmount: 0, totalItems: 0 })
    }

    // Toggle drawer
    const openDrawer = () => setIsDrawerOpen(true)
    const closeDrawer = () => setIsDrawerOpen(false)
    const toggleDrawer = () => setIsDrawerOpen(prev => !prev)

    const value = {
        cart,
        loading,
        isDrawerOpen,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        resetCart,
        refreshCart: fetchCart,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        itemCount: cart.totalItems || 0,
        totalAmount: cart.totalAmount || 0,
    }

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}

export default CartContext
