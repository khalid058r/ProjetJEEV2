import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ShoppingBag, ArrowLeft, ArrowRight, MapPin, Clock,
    CheckCircle, Package, AlertCircle, AlertTriangle
} from 'lucide-react'
import { ordersApi, shopApi } from '../../api'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { QRCodeDisplay } from '../../components/shop'
import toast from 'react-hot-toast'

export default function Checkout() {
    const navigate = useNavigate()
    const { cart, totalAmount, itemCount, resetCart, removeItem } = useCart()
    const { user } = useAuth()
    const { notify } = useNotifications()
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(false)
    const [notes, setNotes] = useState('')
    const [orderCreated, setOrderCreated] = useState(null)
    const [stockWarnings, setStockWarnings] = useState([])

    // Validation du stock au chargement
    useEffect(() => {
        if (cart.items && cart.items.length > 0) {
            validateStock()
        }
    }, [cart.items])

    const validateStock = async () => {
        try {
            setValidating(true)
            const warnings = []

            // Vérifier le stock de chaque produit
            for (const item of cart.items) {
                try {
                    const response = await shopApi.getProductById(item.productId)
                    const product = response.data

                    // Calculer le stock disponible (stock total - stock réservé)
                    const availableStock = (product.stock || 0) - (product.reservedStock || 0)

                    if (availableStock < item.quantity) {
                        warnings.push({
                            productId: item.productId,
                            productTitle: item.productTitle || item.productName,
                            requestedQty: item.quantity,
                            availableStock: Math.max(0, availableStock),
                            totalStock: product.stock || 0,
                            reservedStock: product.reservedStock || 0
                        })
                    }
                } catch (error) {
                    console.warn('Could not validate stock for product', item.productId)
                }
            }

            setStockWarnings(warnings)

            if (warnings.length > 0) {
                toast.error(`${warnings.length} produit(s) en stock insuffisant`)
            }
        } catch (error) {
            console.error('Stock validation error:', error)
        } finally {
            setValidating(false)
        }
    }

    const handleRemoveUnavailableItems = () => {
        stockWarnings.forEach(warning => {
            if (warning.availableStock === 0) {
                removeItem(warning.productId)
            }
        })
        setStockWarnings([])
        toast.success('Articles indisponibles retirés')
    }

    const handleSubmitOrder = async () => {
        if (!cart.items || cart.items.length === 0) {
            toast.error('Votre panier est vide')
            return
        }

        // Bloquer si stock insuffisant
        if (stockWarnings.some(w => w.availableStock === 0)) {
            toast.error('Veuillez retirer les articles indisponibles')
            return
        }

        try {
            setLoading(true)
            const response = await ordersApi.createOrder(notes)
            setOrderCreated(response.data)
            resetCart()

            // Notification de nouvelle commande (pour le vendeur)
            if (notify?.newOrder) {
                notify.newOrder(response.data)
            }

            toast.success('Commande passée avec succès !')
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de la commande'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    // Commande créée - écran de confirmation
    if (orderCreated) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-lg mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-lg p-8 text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Commande confirmée !
                        </h1>
                        <p className="text-gray-500 mb-6">
                            Votre commande a été enregistrée avec succès
                        </p>

                        {/* Order details */}
                        <div className="bg-gray-50 rounded-xl p-6 text-left mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-gray-500">Numéro de commande</span>
                                <span className="font-mono font-bold text-gray-900">
                                    #{orderCreated.id}
                                </span>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-gray-500">Montant total</span>
                                <span className="font-bold text-gray-900">
                                    {orderCreated.totalAmount?.toFixed(2)} MAD
                                </span>
                            </div>

                            {orderCreated.pickupCode && (
                                <div className="mt-6">
                                    <QRCodeDisplay
                                        value={orderCreated.pickupCode}
                                        size={160}
                                        title=""
                                        showActions={true}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Estimated pickup */}
                        <div className="flex items-center justify-center gap-2 text-emerald-600 mb-6">
                            <Clock className="w-5 h-5" />
                            <span className="font-medium">
                                Prête sous 2h
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/account/orders')}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                            >
                                Voir mes commandes
                            </button>
                            <button
                                onClick={() => navigate('/shop')}
                                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Continuer mes achats
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    // Panier vide
    if (!cart.items || cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Panier vide</h2>
                    <p className="text-gray-500 mb-6">Ajoutez des produits pour passer commande</p>
                    <button
                        onClick={() => navigate('/shop')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                        Voir le catalogue
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/cart')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            Finaliser la commande
                        </h1>
                        <p className="text-gray-500 mt-1">Click & Collect</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer info */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Informations client
                            </h2>
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        value={user?.username || ''}
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pickup info */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Retrait en magasin
                            </h2>
                            <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-emerald-900">
                                            Notre Magasin
                                        </p>
                                        <p className="text-sm text-emerald-700">
                                            123 Rue Example, Casablanca
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>Horaires: Lun-Sam 9h-19h</span>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Notes (optionnel)
                            </h2>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Instructions spéciales pour votre commande..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Payment info */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-amber-900">
                                        Paiement en magasin
                                    </p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Le paiement s'effectue lors du retrait de votre commande.
                                        Nous acceptons espèces, carte bancaire et paiement mobile.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Votre commande
                            </h2>

                            {/* Items */}
                            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                {cart.items.map((item) => (
                                    <div key={item.id} className="flex gap-3">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={item.productImageUrl || item.productImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productTitle || item.productName || 'P')}&background=10B981&color=fff&size=48`}
                                                alt={item.productTitle || item.productName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {item.productTitle || item.productName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Qté: {item.quantity} × {item.unitPrice?.toFixed(2)} MAD
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {item.lineTotal?.toFixed(2)} MAD
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Articles ({itemCount})</span>
                                    <span>{totalAmount?.toFixed(2)} MAD</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Retrait</span>
                                    <span className="text-emerald-600">Gratuit</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 mt-4 pt-4">
                                <div className="flex justify-between text-lg">
                                    <span className="font-semibold">Total à payer</span>
                                    <span className="font-bold text-gray-900">
                                        {totalAmount?.toFixed(2)} MAD
                                    </span>
                                </div>
                            </div>

                            {/* Stock warnings */}
                            {stockWarnings.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4"
                                >
                                    <div className="flex items-start gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-amber-800">
                                                Stock insuffisant
                                            </p>
                                            <p className="text-sm text-amber-600 mt-1">
                                                Certains articles ne sont plus disponibles en quantité souhaitée
                                            </p>
                                        </div>
                                    </div>
                                    <ul className="mt-2 space-y-1 text-sm text-amber-700">
                                        {stockWarnings.map((warning, idx) => (
                                            <li key={idx} className="flex justify-between">
                                                <span className="truncate">{warning.productTitle}</span>
                                                <span className="font-medium whitespace-nowrap ml-2">
                                                    {warning.availableStock === 0
                                                        ? 'Rupture'
                                                        : `${warning.availableStock} dispo`
                                                    }
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    {stockWarnings.some(w => w.availableStock === 0) && (
                                        <button
                                            onClick={handleRemoveUnavailableItems}
                                            className="w-full mt-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                                        >
                                            Retirer les articles indisponibles
                                        </button>
                                    )}
                                </motion.div>
                            )}

                            {/* Validation in progress */}
                            {validating && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    Vérification du stock...
                                </div>
                            )}

                            <button
                                onClick={handleSubmitOrder}
                                disabled={loading}
                                className="w-full mt-6 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Traitement...
                                    </>
                                ) : (
                                    <>
                                        <Package className="w-5 h-5" />
                                        Confirmer la commande
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
