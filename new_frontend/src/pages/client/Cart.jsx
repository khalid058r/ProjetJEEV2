import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft,
    ShoppingCart, Package
} from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'

export default function Cart() {
    const navigate = useNavigate()
    const { cart, loading, updateQuantity, removeItem, clearCart, totalAmount, itemCount } = useCart()
    const { isAuthenticated } = useAuth()

    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) {
            await removeItem(itemId)
        } else {
            await updateQuantity(itemId, newQuantity)
        }
    }

    // Non connecté
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-12 h-12 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Connectez-vous</h2>
                    <p className="text-gray-500 mb-6">Pour accéder à votre panier</p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                        Se connecter
                        <ArrowRight className="w-5 h-5" />
                    </Link>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre panier est vide</h2>
                    <p className="text-gray-500 mb-6">Découvrez nos produits et ajoutez-les à votre panier</p>
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                        Voir le catalogue
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Mon Panier</h1>
                        <p className="text-gray-500 mt-1">{itemCount} article(s)</p>
                    </div>
                    <button
                        onClick={clearCart}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                    >
                        <Trash2 className="w-4 h-4" />
                        Vider le panier
                    </button>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl shadow-sm p-4 lg:p-6"
                            >
                                <div className="flex gap-4 lg:gap-6">
                                    {/* Image */}
                                    <Link
                                        to={`/shop/${item.productId}`}
                                        className="w-24 h-24 lg:w-32 lg:h-32 rounded-xl overflow-hidden flex-shrink-0"
                                    >
                                        <img
                                            src={item.productImageUrl || item.productImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productTitle || item.productName || 'P')}&background=10B981&color=fff&size=128`}
                                            alt={item.productTitle || item.productName}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productTitle || item.productName || 'P')}&background=10B981&color=fff&size=128`
                                            }}
                                        />
                                    </Link>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            to={`/shop/${item.productId}`}
                                            className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors line-clamp-2"
                                        >
                                            {item.productTitle || item.productName}
                                        </Link>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Prix unitaire: {item.unitPrice?.toFixed(2)} MAD
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 mt-4">
                                            {/* Quantity */}
                                            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                    disabled={loading}
                                                    className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-10 text-center font-semibold">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                    disabled={loading}
                                                    className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                disabled={loading}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Line total */}
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-gray-900">
                                            {item.lineTotal?.toFixed(2)} MAD
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Continue shopping */}
                        <Link
                            to="/shop"
                            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mt-4"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Continuer mes achats
                        </Link>
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Récapitulatif
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Sous-total</span>
                                    <span className="font-medium">{totalAmount?.toFixed(2)} MAD</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Livraison</span>
                                    <span className="font-medium text-emerald-600">Click & Collect</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 my-4 pt-4">
                                <div className="flex justify-between text-lg">
                                    <span className="font-semibold text-gray-900">Total</span>
                                    <span className="font-bold text-gray-900">
                                        {totalAmount?.toFixed(2)} MAD
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/checkout')}
                                disabled={loading}
                                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                Passer la commande
                                <ArrowRight className="w-5 h-5" />
                            </button>

                            {/* Info */}
                            <div className="mt-6 p-4 bg-emerald-50 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <Package className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-emerald-900">
                                            Click & Collect
                                        </p>
                                        <p className="text-xs text-emerald-700 mt-1">
                                            Votre commande sera prête sous 2h.
                                            Paiement en magasin lors du retrait.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
