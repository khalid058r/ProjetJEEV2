import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ShoppingCart, Heart, Share2, ChevronLeft, Plus, Minus,
    Star, Truck, Shield, RotateCcw, Package
} from 'lucide-react'
import { shopApi } from '../../api'
import { useCart } from '../../context/CartContext'
import toast from 'react-hot-toast'

export default function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { addToCart, loading: cartLoading } = useCart()

    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [selectedImage, setSelectedImage] = useState(0)

    useEffect(() => {
        loadProduct()
    }, [id])

    const loadProduct = async () => {
        try {
            setLoading(true)
            const response = await shopApi.getProductById(id)
            setProduct(response.data)
        } catch (error) {
            console.error('Error loading product:', error)
            toast.error('Produit non trouvé')
            navigate('/shop')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = async () => {
        const result = await addToCart(product.id, quantity)
        if (result.success) {
            setQuantity(1)
        }
    }

    const handleShare = async () => {
        try {
            await navigator.share({
                title: product.name,
                text: product.description,
                url: window.location.href,
            })
        } catch {
            navigator.clipboard.writeText(window.location.href)
            toast.success('Lien copié !')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse">
                        <div className="h-6 w-32 bg-gray-200 rounded mb-8" />
                        <div className="grid lg:grid-cols-2 gap-12">
                            <div className="aspect-square bg-gray-200 rounded-2xl" />
                            <div className="space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-3/4" />
                                <div className="h-10 bg-gray-200 rounded w-1/4" />
                                <div className="h-24 bg-gray-200 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!product) return null

    // Compatibilité avec le backend (stock/quantity, title/name)
    const stockQty = product.stock ?? product.quantity ?? 0
    const productName = product.title || product.name || 'Produit'
    const isOutOfStock = stockQty <= 0
    const imageUrl = product.imageUrl || product.image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&background=10B981&color=fff&size=600`

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-8 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Retour
                </button>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Images */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm"
                        >
                            <img
                                src={imageUrl}
                                alt={productName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&background=10B981&color=fff&size=600`
                                }}
                            />
                        </motion.div>
                    </div>

                    {/* Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Category */}
                        {product.categoryName && (
                            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                {product.categoryName}
                            </span>
                        )}

                        {/* Title */}
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                            {productName}
                        </h1>

                        {/* Rating */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${star <= Math.round(product.rating || 4) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-gray-500">({(product.rating || 4).toFixed(1)}) · {product.reviewCount || 0} avis</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-gray-900">
                                {(product.price || 0).toFixed(2)} MAD
                            </span>
                        </div>

                        {/* Stock status */}
                        <div className={`
                            inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                            ${isOutOfStock
                                ? 'bg-red-100 text-red-700'
                                : stockQty <= 5
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'}
                        `}>
                            <Package className="w-4 h-4" />
                            {isOutOfStock
                                ? 'Rupture de stock'
                                : stockQty <= 5
                                    ? `Plus que ${stockQty} en stock`
                                    : 'En stock'}
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* Quantity selector */}
                        {!isOutOfStock && (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">Quantité:</span>
                                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-2 hover:bg-white rounded-lg transition-colors"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <span className="w-12 text-center font-semibold">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(stockQty, quantity + 1))}
                                        className="p-2 hover:bg-white rounded-lg transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock || cartLoading}
                                className={`
                                    flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
                                    ${isOutOfStock
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg'}
                                `}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {isOutOfStock ? 'Indisponible' : 'Ajouter au panier'}
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                            <div className="text-center p-4">
                                <Truck className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                                <p className="text-sm font-medium text-gray-900">Click & Collect</p>
                                <p className="text-xs text-gray-500">Retrait en magasin</p>
                            </div>
                            <div className="text-center p-4">
                                <Shield className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                                <p className="text-sm font-medium text-gray-900">Paiement sécurisé</p>
                                <p className="text-xs text-gray-500">En magasin</p>
                            </div>
                            <div className="text-center p-4">
                                <RotateCcw className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                                <p className="text-sm font-medium text-gray-900">Retours faciles</p>
                                <p className="text-xs text-gray-500">14 jours</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
