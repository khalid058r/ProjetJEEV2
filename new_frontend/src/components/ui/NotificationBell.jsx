import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    Bell, X, Check, CheckCheck, ShoppingBag, Package, Truck,
    AlertTriangle, Info, CheckCircle, XCircle, Trash2
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)
    const {
        notifications,
        unreadCount,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll
    } = useNotifications()

    // Fermer au clic extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getIcon = (type) => {
        switch (type) {
            case 'order': return ShoppingBag
            case 'success': return CheckCircle
            case 'error': return XCircle
            case 'warning': return AlertTriangle
            case 'delivery': return Truck
            default: return Info
        }
    }

    const getIconStyle = (type) => {
        switch (type) {
            case 'order': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30'
            case 'success': return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
            case 'error': return 'text-red-500 bg-red-100 dark:bg-red-900/30'
            case 'warning': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30'
            case 'delivery': return 'text-teal-500 bg-teal-100 dark:bg-teal-900/30'
            default: return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
        }
    }

    const formatTime = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: fr })
        } catch {
            return ''
        }
    }

    const handleNotificationClick = (notif) => {
        markAsRead(notif.id)
        if (notif.link) {
            setIsOpen(false)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
            >
                <Bell className="w-5 h-5 text-dark-600 dark:text-dark-300" />

                {/* Badge compteur */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Pulse animation */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-50" />
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-dark-200 dark:border-dark-700 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Bell className="w-5 h-5" />
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                            {unreadCount} nouvelles
                                        </span>
                                    )}
                                </h3>
                                <div className="flex items-center gap-1">
                                    {notifications.length > 0 && (
                                        <>
                                            <button
                                                onClick={markAllAsRead}
                                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                                title="Tout marquer comme lu"
                                            >
                                                <CheckCheck className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={clearAll}
                                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                                title="Tout effacer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Liste */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell className="w-8 h-8 text-dark-400" />
                                    </div>
                                    <p className="text-dark-500 font-medium">Aucune notification</p>
                                    <p className="text-dark-400 text-sm mt-1">Vous êtes à jour !</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-dark-100 dark:divide-dark-700">
                                    {notifications.slice(0, 15).map((notif) => {
                                        const Icon = getIcon(notif.type)
                                        const iconStyle = getIconStyle(notif.type)

                                        const content = (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`p-4 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors cursor-pointer ${!notif.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                                                    }`}
                                                onClick={() => handleNotificationClick(notif)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`p-2 rounded-xl flex-shrink-0 ${iconStyle}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-medium text-dark-900 dark:text-white text-sm">
                                                                {notif.title}
                                                            </p>
                                                            {!notif.read && (
                                                                <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-dark-600 dark:text-dark-300 line-clamp-2 mt-0.5">
                                                            {notif.message}
                                                        </p>

                                                        {/* Code de retrait si présent */}
                                                        {notif.pickupCode && (
                                                            <div className="mt-2 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                                                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                                                    Code de retrait:
                                                                </p>
                                                                <p className="text-lg font-mono font-bold text-emerald-600">
                                                                    {notif.pickupCode}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <p className="text-xs text-dark-400 mt-2">
                                                            {formatTime(notif.timestamp)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            e.preventDefault()
                                                            removeNotification(notif.id)
                                                        }}
                                                        className="p-1 text-dark-400 hover:text-dark-600 dark:hover:text-dark-200 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )

                                        if (notif.link) {
                                            return (
                                                <Link key={notif.id} to={notif.link}>
                                                    {content}
                                                </Link>
                                            )
                                        }
                                        return <div key={notif.id}>{content}</div>
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 15 && (
                            <div className="p-3 border-t border-dark-100 dark:border-dark-700 text-center">
                                <p className="text-sm text-dark-500">
                                    + {notifications.length - 15} autres notifications
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default NotificationBell
