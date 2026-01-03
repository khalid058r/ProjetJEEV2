import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Package, Clock, ChevronRight, ShoppingBag, Search,
    Filter, RefreshCw
} from 'lucide-react'
import { ordersApi } from '../../api'
import { OrderStatusBadge } from '../../components/shop'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Orders() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        loadOrders()
    }, [])

    const loadOrders = async () => {
        try {
            setLoading(true)
            const response = await ordersApi.getMyOrders()
            // Handle both array and object responses
            const data = response.data
            const ordersArray = Array.isArray(data) ? data : (data?.content || data?.orders || [])
            setOrders(ordersArray)
        } catch (error) {
            console.error('Error loading orders:', error)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const filteredOrders = (orders || []).filter(order => {
        if (filter === 'all') return true
        if (filter === 'active') return !['COMPLETED', 'CANCELLED'].includes(order.status)
        if (filter === 'completed') return order.status === 'COMPLETED'
        if (filter === 'cancelled') return order.status === 'CANCELLED'
        return true
    })

    const formatDate = (dateString) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr })
        } catch {
            return dateString
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3" />
                        <div className="h-32 bg-gray-200 rounded-2xl" />
                        <div className="h-32 bg-gray-200 rounded-2xl" />
                        <div className="h-32 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            Mes Commandes
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {orders.length} commande(s) au total
                        </p>
                    </div>
                    <button
                        onClick={loadOrders}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { key: 'all', label: 'Toutes' },
                        { key: 'active', label: 'En cours' },
                        { key: 'completed', label: 'Terminées' },
                        { key: 'cancelled', label: 'Annulées' },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`
                                px-4 py-2 rounded-xl text-sm font-medium transition-colors
                                ${filter === f.key
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'}
                            `}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Orders list */}
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Aucune commande
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {filter === 'all'
                                ? "Vous n'avez pas encore passé de commande"
                                : "Aucune commande dans cette catégorie"}
                        </p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Découvrir le catalogue
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    to={`/account/orders/${order.id}`}
                                    className="block bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-mono font-bold text-gray-900">
                                                    Commande #{order.id}
                                                </span>
                                                <OrderStatusBadge status={order.status} />
                                            </div>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {formatDate(order.orderDate || order.saleDate)}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>

                                    {/* Items preview */}
                                    <div className="flex items-center gap-2 mb-4">
                                        {order.items?.slice(0, 3).map((item, i) => (
                                            <div
                                                key={i}
                                                className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden"
                                            >
                                                <img
                                                    src={item.productImageUrl || item.productImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productTitle || item.productName || 'P')}&background=10B981&color=fff&size=48`}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                        {order.items?.length > 3 && (
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                                                +{order.items.length - 3}
                                            </div>
                                        )}
                                        {(!order.items || order.items.length === 0) && (
                                            <span className="text-sm text-gray-500">
                                                {order.itemCount || 0} article(s)
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <span className="text-sm text-gray-600">Total</span>
                                        <span className="font-bold text-gray-900">
                                            {order.totalAmount?.toFixed(2)} MAD
                                        </span>
                                    </div>

                                    {/* Pickup code for ready orders */}
                                    {order.status === 'READY_PICKUP' && order.pickupCode && (
                                        <div className="mt-4 p-3 bg-emerald-50 rounded-xl">
                                            <p className="text-xs text-emerald-600 mb-1">Code de retrait</p>
                                            <p className="font-mono font-bold text-emerald-700 text-lg">
                                                {order.pickupCode}
                                            </p>
                                        </div>
                                    )}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
