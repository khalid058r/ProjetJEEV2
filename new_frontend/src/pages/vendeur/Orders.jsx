import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Package, Clock, CheckCircle2, XCircle, Search, RefreshCw,
    MapPin, Phone, User, ShoppingBag, ArrowRight, Eye, AlertTriangle,
    Sparkles, Filter, ChevronDown, Bell, BellRing, BarChart3
} from 'lucide-react'
import { ordersApi } from '../../api'
import { Card, Button, Badge, Loading, Modal } from '../../components/ui'
import { formatCurrency, formatRelativeTime } from '../../utils/formatters'
import { useNotifications } from '../../context/NotificationContext'
import toast from 'react-hot-toast'

const ORDER_STATUSES = {
    // Nouvelle commande (stock réservé, en attente de confirmation vendeur)
    PENDING: { label: 'Nouvelle', color: 'warning', icon: ShoppingBag, description: 'En attente de confirmation' },
    CREATED: { label: 'Nouvelle', color: 'secondary', icon: ShoppingBag, description: 'En attente de confirmation' },
    // Confirmée par le vendeur
    CONFIRMED: { label: 'Confirmée', color: 'info', icon: CheckCircle2, description: 'Prête à être préparée' },
    // En cours de préparation
    PENDING_PICKUP: { label: 'En préparation', color: 'primary', icon: Clock, description: 'Préparation en cours' },
    PROCESSING: { label: 'En préparation', color: 'primary', icon: Package, description: 'Préparation en cours' },
    // Prête pour retrait
    READY: { label: 'Prête', color: 'success', icon: Package, description: 'Client peut récupérer' },
    READY_PICKUP: { label: 'Prête', color: 'success', icon: Package, description: 'Client peut récupérer' },
    // Finalisée
    COMPLETED: { label: 'Récupérée', color: 'success', icon: CheckCircle2, description: 'Commande terminée' },
    // Annulée par le client
    CANCELLED: { label: 'Annulée', color: 'danger', icon: XCircle, description: 'Annulée par le client' },
    // Rejetée par le vendeur
    REJECTED: { label: 'Rejetée', color: 'danger', icon: AlertTriangle, description: 'Rejetée par le vendeur' },
}

// Polling interval en ms (30 secondes)
const POLLING_INTERVAL = 30000

export default function VendeurOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(null)
    const [isPolling, setIsPolling] = useState(true)
    const [lastOrderCount, setLastOrderCount] = useState(0)
    const [hasNewOrders, setHasNewOrders] = useState(false)

    const { addNotification } = useNotifications()
    const pollingRef = useRef(null)
    const audioRef = useRef(null)

    // Fonction pour jouer un son de notification
    const playNotificationSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
            oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.1)
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2)

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.3)
        } catch (e) {
            console.log('Could not play notification sound')
        }
    }, [])

    // Fetch orders avec détection de nouvelles commandes
    const fetchOrders = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true)
            const response = await ordersApi.getPendingOrders().catch(() => ({ data: [] }))
            const newOrders = response.data || []

            // Détecter les nouvelles commandes
            const pendingNewOrders = newOrders.filter(o => o.status === 'PENDING' || o.status === 'CREATED')

            if (lastOrderCount > 0 && pendingNewOrders.length > lastOrderCount) {
                const diff = pendingNewOrders.length - lastOrderCount
                setHasNewOrders(true)
                playNotificationSound()
                toast.success(`${diff} nouvelle(s) commande(s) !`, {
                    icon: '🔔',
                    duration: 5000
                })

                if (addNotification) {
                    addNotification({
                        type: 'order',
                        title: 'Nouvelle commande',
                        message: `${diff} nouvelle(s) commande(s) Click & Collect`,
                        priority: 'high'
                    })
                }
            }

            setLastOrderCount(pendingNewOrders.length)
            setOrders(newOrders)
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }, [lastOrderCount, playNotificationSound, addNotification])

    // Initial fetch
    useEffect(() => {
        fetchOrders()
    }, [])

    // Polling effect
    useEffect(() => {
        if (isPolling) {
            pollingRef.current = setInterval(() => {
                fetchOrders(false) // Sans loader pour le polling
            }, POLLING_INTERVAL)
        }

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current)
            }
        }
    }, [isPolling, fetchOrders])

    const handleMarkReady = async (orderId) => {
        try {
            setActionLoading(orderId)
            await ordersApi.markOrderReady(orderId)
            toast.success('Commande marquée comme prête !')
            fetchOrders()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    const handleMarkComplete = async (orderId) => {
        try {
            setActionLoading(orderId)
            await ordersApi.markOrderComplete(orderId)
            toast.success('Commande récupérée avec succès !')
            fetchOrders()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    const handleConfirmOrder = async (orderId) => {
        try {
            setActionLoading(orderId)
            await ordersApi.confirmOrder(orderId)
            toast.success('Commande confirmée !')
            fetchOrders()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    const handleProcessOrder = async (orderId) => {
        try {
            setActionLoading(orderId)
            await ordersApi.processOrder(orderId)
            toast.success('Commande en préparation !')
            fetchOrders()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    const handleRejectOrder = async (orderId) => {
        const reason = window.prompt('Raison du rejet:')
        if (!reason) return

        try {
            setActionLoading(orderId)
            await ordersApi.rejectOrder(orderId, reason)
            toast.success('Commande rejetée')
            fetchOrders()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.pickupCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id?.toString().includes(searchQuery)

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter

        return matchesSearch && matchesStatus
    })

    // Compteurs avec les nouveaux statuts
    const newCount = orders.filter(o => o.status === 'PENDING' || o.status === 'CREATED').length
    const confirmedCount = orders.filter(o => o.status === 'CONFIRMED').length
    const pendingCount = orders.filter(o => ['PENDING_PICKUP', 'PROCESSING'].includes(o.status)).length
    const readyCount = orders.filter(o => ['READY', 'READY_PICKUP'].includes(o.status)).length
    const rejectedCount = orders.filter(o => o.status === 'REJECTED').length

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                        <ShoppingBag className="w-7 h-7 text-primary-500" />
                        Commandes Click & Collect
                    </h1>
                    <p className="text-dark-500 mt-1">
                        Gérez les commandes clients en attente de retrait
                    </p>
                </div>
                <Button onClick={fetchOrders} variant="outline" icon={RefreshCw}>
                    Actualiser
                </Button>

                {/* Toggle polling */}
                <button
                    onClick={() => setIsPolling(!isPolling)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${isPolling
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                    title={isPolling ? 'Arrêter les mises à jour automatiques' : 'Activer les mises à jour automatiques'}
                >
                    {isPolling ? (
                        <>
                            <BellRing className="w-4 h-4 animate-pulse" />
                            <span className="hidden sm:inline">Auto</span>
                        </>
                    ) : (
                        <>
                            <Bell className="w-4 h-4" />
                            <span className="hidden sm:inline">Manuel</span>
                        </>
                    )}
                </button>
            </div>

            {/* New orders alert */}
            {hasNewOrders && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <BellRing className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold">Nouvelles commandes !</p>
                            <p className="text-sm text-white/80">Des clients attendent leur commande</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setHasNewOrders(false)}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                    >
                        OK
                    </button>
                </motion.div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {/* Nouvelles */}
                <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/80">Nouvelles</p>
                            <p className="text-3xl font-bold">{newCount}</p>
                        </div>
                        <ShoppingBag className="w-10 h-10 text-white/50" />
                    </div>
                </Card>
                {/* Confirmées */}
                <Card className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/80">Confirmées</p>
                            <p className="text-3xl font-bold">{confirmedCount}</p>
                        </div>
                        <CheckCircle2 className="w-10 h-10 text-white/50" />
                    </div>
                </Card>
                {/* En préparation */}
                <Card className="p-4 bg-gradient-to-br from-purple-500 to-violet-500 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/80">En préparation</p>
                            <p className="text-3xl font-bold">{pendingCount}</p>
                        </div>
                        <Clock className="w-10 h-10 text-white/50" />
                    </div>
                </Card>
                {/* Prêtes */}
                <Card className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/80">Prêtes</p>
                            <p className="text-3xl font-bold">{readyCount}</p>
                        </div>
                        <Package className="w-10 h-10 text-white/50" />
                    </div>
                </Card>
                {/* Total */}
                <Card className="p-4 bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/80">Total</p>
                            <p className="text-3xl font-bold">{orders.length}</p>
                        </div>
                        <BarChart3 className="w-10 h-10 text-white/50" />
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par code de retrait, nom..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="PENDING">🆕 Nouvelles</option>
                        <option value="CONFIRMED">✅ Confirmées</option>
                        <option value="PROCESSING">📦 En préparation</option>
                        <option value="READY_PICKUP">🎁 Prêtes</option>
                        <option value="COMPLETED">✔️ Récupérées</option>
                        <option value="CANCELLED">❌ Annulées</option>
                        <option value="REJECTED">⛔ Rejetées</option>
                    </select>
                </div>
            </Card>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-2">
                        Aucune commande
                    </h3>
                    <p className="text-dark-500">
                        Les nouvelles commandes apparaîtront ici
                    </p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {filteredOrders.map((order, index) => {
                            const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.PENDING
                            const StatusIcon = statusInfo.icon

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                            {/* Order Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`w-10 h-10 rounded-xl bg-${statusInfo.color}-100 dark:bg-${statusInfo.color}-900/30 flex items-center justify-center`}>
                                                        <StatusIcon className={`w-5 h-5 text-${statusInfo.color}-600`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-dark-900 dark:text-white">
                                                                Commande #{order.id}
                                                            </span>
                                                            <Badge variant={statusInfo.color}>
                                                                {statusInfo.label}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-dark-500">
                                                            {formatRelativeTime(order.orderDate)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Customer Info */}
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-dark-600 dark:text-dark-400">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        {order.customerName || 'Client'}
                                                    </span>
                                                    {order.customerPhone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-4 h-4" />
                                                            {order.customerPhone}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Package className="w-4 h-4" />
                                                        {order.items?.length || 0} article(s)
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Pickup Code */}
                                            {order.pickupCode && (
                                                <div className="bg-dark-100 dark:bg-dark-700 rounded-xl px-4 py-2 text-center">
                                                    <p className="text-xs text-dark-500 mb-1">Code retrait</p>
                                                    <p className="font-mono font-bold text-xl text-dark-900 dark:text-white tracking-widest">
                                                        {order.pickupCode}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Total */}
                                            <div className="text-center lg:text-right">
                                                <p className="text-xs text-dark-500">Total</p>
                                                <p className="text-xl font-bold text-dark-900 dark:text-white">
                                                    {formatCurrency(order.totalAmount)}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    icon={Eye}
                                                    onClick={() => {
                                                        setSelectedOrder(order)
                                                        setShowDetailModal(true)
                                                    }}
                                                >
                                                    Détails
                                                </Button>

                                                {/* Nouvelle commande - Confirmer ou Rejeter */}
                                                {(order.status === 'PENDING' || order.status === 'CREATED') && (
                                                    <>
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            icon={CheckCircle2}
                                                            loading={actionLoading === order.id}
                                                            onClick={() => handleConfirmOrder(order.id)}
                                                        >
                                                            Confirmer
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            icon={XCircle}
                                                            loading={actionLoading === order.id}
                                                            onClick={() => handleRejectOrder(order.id)}
                                                        >
                                                            Rejeter
                                                        </Button>
                                                    </>
                                                )}

                                                {/* Confirmée - Mettre en préparation */}
                                                {(order.status === 'CONFIRMED') && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        icon={Package}
                                                        loading={actionLoading === order.id}
                                                        onClick={() => handleProcessOrder(order.id)}
                                                    >
                                                        Préparer
                                                    </Button>
                                                )}

                                                {/* En attente/préparation - Marquer prête */}
                                                {(order.status === 'PENDING' || order.status === 'PENDING_PICKUP' || order.status === 'PROCESSING') && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        icon={Package}
                                                        loading={actionLoading === order.id}
                                                        onClick={() => handleMarkReady(order.id)}
                                                    >
                                                        Prête
                                                    </Button>
                                                )}

                                                {/* Prête - Marquer récupérée */}
                                                {(order.status === 'READY' || order.status === 'READY_PICKUP') && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        icon={CheckCircle2}
                                                        loading={actionLoading === order.id}
                                                        onClick={() => handleMarkComplete(order.id)}
                                                    >
                                                        Récupérée
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`Commande #${selectedOrder?.id}`}
                size="lg"
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        {/* Status */}
                        <div className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <span className="text-dark-600">Statut</span>
                            <Badge variant={ORDER_STATUSES[selectedOrder.status]?.color || 'secondary'}>
                                {ORDER_STATUSES[selectedOrder.status]?.label || selectedOrder.status}
                            </Badge>
                        </div>

                        {/* Pickup Code */}
                        {selectedOrder.pickupCode && (
                            <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                <p className="text-sm text-emerald-600 mb-2">Code de retrait</p>
                                <p className="font-mono text-4xl font-bold text-emerald-700 dark:text-emerald-400 tracking-widest">
                                    {selectedOrder.pickupCode}
                                </p>
                            </div>
                        )}

                        {/* Customer */}
                        <div>
                            <h4 className="font-medium text-dark-900 dark:text-white mb-3">Client</h4>
                            <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-dark-400" />
                                    {selectedOrder.customerName || 'Client'}
                                </p>
                                {selectedOrder.customerPhone && (
                                    <p className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-dark-400" />
                                        {selectedOrder.customerPhone}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h4 className="font-medium text-dark-900 dark:text-white mb-3">Articles</h4>
                            <div className="space-y-2">
                                {selectedOrder.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            {(item.productImageUrl || item.productImage) ? (
                                                <img src={item.productImageUrl || item.productImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-dark-200 dark:bg-dark-700 flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-dark-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-dark-900 dark:text-white">
                                                    {item.productTitle || 'Produit'}
                                                </p>
                                                <p className="text-sm text-dark-500">
                                                    Qté: {item.quantity} × {formatCurrency(item.unitPrice)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-semibold">
                                            {formatCurrency(item.lineTotal)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                            <span className="font-medium text-dark-900 dark:text-white">Total</span>
                            <span className="text-2xl font-bold text-primary-600">
                                {formatCurrency(selectedOrder.totalAmount)}
                            </span>
                        </div>

                        {/* Notes */}
                        {selectedOrder.notes && (
                            <div>
                                <h4 className="font-medium text-dark-900 dark:text-white mb-2">Notes</h4>
                                <p className="text-dark-600 dark:text-dark-400 bg-dark-50 dark:bg-dark-800 p-3 rounded-xl">
                                    {selectedOrder.notes}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-dark-200 dark:border-dark-700">
                            {/* Nouvelle commande */}
                            {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'CREATED') && (
                                <>
                                    <Button
                                        variant="success"
                                        className="flex-1"
                                        icon={CheckCircle2}
                                        loading={actionLoading === selectedOrder.id}
                                        onClick={() => {
                                            handleConfirmOrder(selectedOrder.id)
                                            setShowDetailModal(false)
                                        }}
                                    >
                                        Confirmer
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="flex-1"
                                        icon={XCircle}
                                        loading={actionLoading === selectedOrder.id}
                                        onClick={() => {
                                            handleRejectOrder(selectedOrder.id)
                                            setShowDetailModal(false)
                                        }}
                                    >
                                        Rejeter
                                    </Button>
                                </>
                            )}

                            {/* Confirmée */}
                            {selectedOrder.status === 'CONFIRMED' && (
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    icon={Package}
                                    loading={actionLoading === selectedOrder.id}
                                    onClick={() => {
                                        handleProcessOrder(selectedOrder.id)
                                        setShowDetailModal(false)
                                    }}
                                >
                                    Mettre en préparation
                                </Button>
                            )}

                            {/* En attente/préparation */}
                            {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'PENDING_PICKUP' || selectedOrder.status === 'PROCESSING') && (
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    icon={Package}
                                    loading={actionLoading === selectedOrder.id}
                                    onClick={() => {
                                        handleMarkReady(selectedOrder.id)
                                        setShowDetailModal(false)
                                    }}
                                >
                                    Marquer comme prête
                                </Button>
                            )}

                            {/* Prête */}
                            {(selectedOrder.status === 'READY' || selectedOrder.status === 'READY_PICKUP') && (
                                <Button
                                    variant="success"
                                    className="flex-1"
                                    icon={CheckCircle2}
                                    loading={actionLoading === selectedOrder.id}
                                    onClick={() => {
                                        handleMarkComplete(selectedOrder.id)
                                        setShowDetailModal(false)
                                    }}
                                >
                                    Marquer comme récupérée
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => setShowDetailModal(false)}
                            >
                                Fermer
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
