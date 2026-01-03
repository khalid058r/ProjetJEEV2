import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'

export default function CartDrawer({ isOpen, onClose }) {
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

    const handleCheckout = () => {
        onClose()
        navigate('/checkout')
    }

    const handleViewCart = () => {
        onClose()
        navigate('/cart')
    }

    const handleLogin = () => {
        onClose()
        navigate('/login')
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-6 h-6 text-emerald-600" />
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Mon Panier
                                    {itemCount > 0 && (
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            ({itemCount} article{itemCount > 1 ? 's' : ''})
                                        </span>
                                    )}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {!isAuthenticated ? (
                                // Non connecté
                                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <ShoppingBag className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Connectez-vous
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        Pour ajouter des produits à votre panier
                                    </p>
                                    <button
                                        onClick={handleLogin}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                                    >
                                        Se connecter
                                    </button>
                                </div>
                            ) : cart.items?.length === 0 ? (
                                // Panier vide
                                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <ShoppingBag className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Votre panier est vide
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        Découvrez nos produits et ajoutez-les à votre panier
                                    </p>
                                    <button
                                        onClick={() => {
                                            onClose()
                                            navigate('/shop')
                                        }}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                                    >
                                        Voir le catalogue
                                    </button>
                                </div>
                            ) : (
                                // Liste des articles
                                <div className="p-4 space-y-4">
                                    {cart.items?.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            className="flex gap-4 p-3 bg-gray-50 rounded-xl"
                                        >
                                            {/* Image */}
                                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                                <img
                                                    src={item.productImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productName)}&background=10B981&color=fff&size=80`}
                                                    alt={item.productName}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.productName)}&background=10B981&color=fff&size=80`
                                                    }}
                                                />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {item.productName}
                                                </h4>
                                                <p className="text-sm text-gray-500">
                                                    {item.unitPrice?.toFixed(2)} MAD
                                                </p>

                                                {/* Quantity controls */}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200">
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                            disabled={loading}
                                                            className="p-1.5 hover:bg-gray-100 rounded-l-lg transition-colors disabled:opacity-50"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="px-3 text-sm font-medium">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                            disabled={loading}
                                                            className="p-1.5 hover:bg-gray-100 rounded-r-lg transition-colors disabled:opacity-50"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        disabled={loading}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Line total */}
                                            <div className="text-right">
                                                <span className="font-semibold text-gray-900">
                                                    {item.lineTotal?.toFixed(2)} MAD
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Clear cart button */}
                                    {cart.items?.length > 0 && (
                                        <button
                                            onClick={clearCart}
                                            disabled={loading}
                                            className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            Vider le panier
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {isAuthenticated && cart.items?.length > 0 && (
                            <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                                {/* Total */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Sous-total</span>
                                    <span className="text-xl font-bold text-gray-900">
                                        {totalAmount?.toFixed(2)} MAD
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="space-y-2">
                                    <button
                                        onClick={handleCheckout}
                                        disabled={loading}
                                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                    >
                                        Commander
                                    </button>
                                    <button
                                        onClick={handleViewCart}
                                        className="w-full py-3 bg-white text-gray-700 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                                    >
                                        Voir le panier
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
