import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft, Package, MapPin, Clock, Phone, XCircle,
    Copy, CheckCircle
} from 'lucide-react'
import { ordersApi } from '../../api'
import { OrderStatusBadge, OrderTimeline, QRCodeDisplay } from '../../components/shop'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function OrderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => {
        loadOrder()
    }, [id])

    const loadOrder = async () => {
        try {
            setLoading(true)
            const response = await ordersApi.getOrderById(id)
            setOrder(response.data)
        } catch (error) {
            console.error('Error loading order:', error)
            toast.error('Commande non trouvée')
            navigate('/account/orders')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelOrder = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
            return
        }

        try {
            setCancelling(true)
            await ordersApi.cancelOrder(id)
            toast.success('Commande annulée')
            loadOrder()
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de l\'annulation'
            toast.error(message)
        } finally {
            setCancelling(false)
        }
    }

    const copyPickupCode = () => {
        if (order?.pickupCode) {
            navigator.clipboard.writeText(order.pickupCode)
            toast.success('Code copié !')
        }
    }

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), "d MMMM yyyy 'à' HH:mm", { locale: fr })
        } catch {
            return dateString
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4" />
                        <div className="h-40 bg-gray-200 rounded-2xl" />
                        <div className="h-60 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!order) return null

    // Utiliser canCancelByClient du backend ou fallback sur les statuts
    const canCancel = order.canCancelByClient ?? ['PENDING', 'CREATED', 'CONFIRMED'].includes(order.status)
    const isRejected = order.status === 'REJECTED'
    const isCancelled = order.status === 'CANCELLED'

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/account/orders')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Commande #{order.id}
                            </h1>
                            <OrderStatusBadge status={order.status} size="lg" />
                        </div>
                        <p className="text-gray-500 mt-1">
                            Passée le {formatDate(order.orderDate || order.saleDate)}
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Timeline */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                Suivi de commande
                            </h2>
                            <OrderTimeline status={order.status} />
                        </motion.div>

                        {/* Items */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl shadow-sm p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Articles ({order.items?.length || 0})
                            </h2>
                            <div className="space-y-4">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={item.productImageUrl || item.productImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productTitle || item.productName || 'P')}&background=10B981&color=fff&size=64`}
                                                alt={item.productTitle || item.productName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900">
                                                {item.productTitle || item.productName}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {item.unitPrice?.toFixed(2)} MAD × {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-semibold text-gray-900">
                                                {item.lineTotal?.toFixed(2)} MAD
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="border-t border-gray-200 mt-4 pt-4">
                                <div className="flex justify-between text-lg">
                                    <span className="font-semibold text-gray-900">Total</span>
                                    <span className="font-bold text-gray-900">
                                        {order.totalAmount?.toFixed(2)} MAD
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Notes */}
                        {order.notes && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-2xl shadow-sm p-6"
                            >
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                    Notes
                                </h2>
                                <p className="text-gray-600">{order.notes}</p>
                            </motion.div>
                        )}

                        {/* Raison de rejet */}
                        {isRejected && order.rejectionReason && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="bg-red-50 border border-red-200 rounded-2xl p-6"
                            >
                                <div className="flex items-start gap-3">
                                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-red-800 mb-1">
                                            Commande rejetée
                                        </h2>
                                        <p className="text-red-700">{order.rejectionReason}</p>
                                        {order.rejectedAt && (
                                            <p className="text-sm text-red-500 mt-2">
                                                Le {formatDate(order.rejectedAt)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Raison d'annulation */}
                        {isCancelled && order.cancellationReason && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="bg-gray-100 border border-gray-200 rounded-2xl p-6"
                            >
                                <div className="flex items-start gap-3">
                                    <XCircle className="w-6 h-6 text-gray-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                                            Commande annulée
                                        </h2>
                                        <p className="text-gray-700">{order.cancellationReason}</p>
                                        {order.cancelledAt && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                Le {formatDate(order.cancelledAt)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Pickup code with QR */}
                        {order.pickupCode && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <QRCodeDisplay
                                    value={order.pickupCode}
                                    size={180}
                                    title="Code de retrait"
                                    showActions={true}
                                    className="shadow-sm"
                                />
                            </motion.div>
                        )}

                        {/* Store info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl shadow-sm p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Point de retrait
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Notre Magasin</p>
                                        <p className="text-sm text-gray-500">
                                            123 Rue Example, Casablanca
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        Lun-Sam: 9h-19h
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        +212 5XX-XXXXXX
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Cancel button */}
                        {canCancel && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={cancelling}
                                    className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <XCircle className="w-5 h-5" />
                                    {cancelling ? 'Annulation...' : 'Annuler la commande'}
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
