import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

// Son de notification
const playNotificationSound = () => {
    try {
        // Créer un son simple avec Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
    } catch (e) {
        // Ignorer si audio non supporté
    }
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([])
    const { user } = useAuth()
    const lastOrderCheckRef = useRef(null)
    const pollingIntervalRef = useRef(null)

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('notifications')
        if (saved) {
            try {
                setNotifications(JSON.parse(saved))
            } catch (e) {
                console.error('Error loading notifications:', e)
            }
        }
    }, [])

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications))
    }, [notifications])

    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        }
        setNotifications(prev => [newNotification, ...prev].slice(0, 50)) // Keep max 50
        return newNotification.id
    }, [])

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    const markAsRead = useCallback((id) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ))
    }, [])

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [])

    const clearAll = useCallback(() => {
        setNotifications([])
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    // Notification types with presets
    const notify = {
        success: (title, message, link) => addNotification({ type: 'success', title, message, link }),
        error: (title, message, link) => addNotification({ type: 'error', title, message, link }),
        warning: (title, message, link) => addNotification({ type: 'warning', title, message, link }),
        info: (title, message, link) => addNotification({ type: 'info', title, message, link }),

        // Specific notifications
        lowStock: (product) => addNotification({
            type: 'warning',
            title: 'Stock faible',
            message: `${product.title} - ${product.stock} unités restantes`,
            link: `/admin/products/${product.id}`,
            category: 'stock'
        }),
        newSale: (sale) => addNotification({
            type: 'success',
            title: 'Nouvelle vente',
            message: `Vente #${sale.id} - ${sale.totalAmount} DH`,
            link: `/admin/sales/${sale.id}`,
            category: 'sales'
        }),
        userActivity: (user, action) => addNotification({
            type: 'info',
            title: 'Activité utilisateur',
            message: `${user.username} ${action}`,
            link: `/admin/users/${user.id}`,
            category: 'users'
        }),

        // Click & Collect notifications
        newOrder: (order) => {
            playNotificationSound()
            return addNotification({
                type: 'order',
                title: '🛒 Nouvelle commande !',
                message: `Commande #${order.id} - ${order.customerName || 'Client'} - ${order.totalAmount?.toFixed(2)} MAD`,
                link: `/vendeur/orders`,
                category: 'orders',
                orderId: order.id,
                priority: 'high'
            })
        },
        orderReady: (order) => {
            playNotificationSound()
            return addNotification({
                type: 'success',
                title: '📦 Commande prête !',
                message: `Votre commande #${order.id} est prête à retirer. Code: ${order.pickupCode}`,
                link: `/account/orders/${order.id}`,
                category: 'orders',
                orderId: order.id,
                pickupCode: order.pickupCode,
                priority: 'high'
            })
        },
        orderCompleted: (order) => addNotification({
            type: 'success',
            title: '✅ Commande récupérée',
            message: `Commande #${order.id} finalisée avec succès`,
            link: `/account/orders/${order.id}`,
            category: 'orders',
            orderId: order.id
        }),
        orderCancelled: (order) => addNotification({
            type: 'error',
            title: '❌ Commande annulée',
            message: `La commande #${order.id} a été annulée`,
            link: `/account/orders/${order.id}`,
            category: 'orders',
            orderId: order.id
        }),
    }

    const value = {
        notifications,
        unreadCount,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        notify,
        playSound: playNotificationSound
    }

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider')
    }
    return context
}

export default NotificationContext
