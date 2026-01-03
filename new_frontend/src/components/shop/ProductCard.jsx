import { motion } from 'framer-motion'
import { ShoppingCart, Eye, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

export default function ProductCard({ product }) {
    const navigate = useNavigate()
    const { addToCart, loading } = useCart()

    const handleAddToCart = async (e) => {
        e.stopPropagation()
        await addToCart(product.id, 1)
    }

    const handleClick = () => {
        navigate(`/shop/${product.id}`)
    }

    // Calculer le stock status
    const getStockStatus = () => {
        const stockQty = product.stock ?? product.quantity ?? 0
        if (stockQty <= 0) return { text: 'Rupture', color: 'bg-red-100 text-red-700' }
        if (stockQty <= 5) return { text: 'Stock faible', color: 'bg-amber-100 text-amber-700' }
        return { text: 'En stock', color: 'bg-emerald-100 text-emerald-700' }
    }

    const stockStatus = getStockStatus()
    const stockQty = product.stock ?? product.quantity ?? 0
    const isOutOfStock = stockQty <= 0

    // Nom du produit (backend utilise 'title', fallback sur 'name')
    const productName = product.title || product.name || 'Produit'

    // Image placeholder si pas d'image
    const imageUrl = product.imageUrl || product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&background=10B981&color=fff&size=300`

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
        >
            {/* Image */}
            <div
                className="relative aspect-square overflow-hidden cursor-pointer"
                onClick={handleClick}
            >
                <img
                    src={imageUrl}
                    alt={productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&background=10B981&color=fff&size=300`
                    }}
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                {/* Quick view button */}
                <button
                    onClick={handleClick}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-emerald-50"
                >
                    <Eye className="w-5 h-5 text-gray-700" />
                </button>

                {/* Stock badge */}
                <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                    {stockStatus.text}
                </span>

                {/* Category badge */}
                {product.categoryName && (
                    <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                        {product.categoryName}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Category */}
                {product.categoryName && (
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        {product.categoryName}
                    </p>
                )}

                {/* Name */}
                <h3
                    className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-emerald-600 transition-colors"
                    onClick={handleClick}
                >
                    {productName}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`w-4 h-4 ${star <= Math.round(product.rating || 4) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                        />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">({(product.rating || 4).toFixed(1)})</span>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xl font-bold text-gray-900">
                            {product.price?.toFixed(2)} MAD
                        </span>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || loading}
                        className={`
                            p-3 rounded-xl transition-all duration-200
                            ${isOutOfStock
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200'}
                        `}
                    >
                        <ShoppingCart className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
