import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ShoppingCart, Search, Package, Check, Minus, Plus,
    Trash2, CreditCard, Receipt
} from 'lucide-react'
import { productApi, saleApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { Card, Button, Loading, EmptyState, Input, SearchInput, Badge } from '../../components/ui'
import { formatCurrency, getStockStatus } from '../../utils/formatters'
import { getOptimizedImageUrl } from '../../utils/cloudinary'
import toast from 'react-hot-toast'

export default function NewSale() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [cart, setCart] = useState([])
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const response = await productApi.getAll()
            setProducts(response.data?.filter(p => p.stock > 0) || [])
        } catch (error) {
            toast.error('Erreur lors du chargement des produits')
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(product =>
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id)
        if (existing) {
            if (existing.quantity < product.stock) {
                setCart(cart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ))
            } else {
                toast.error('Stock insuffisant')
            }
        } else {
            setCart([...cart, { ...product, quantity: 1 }])
        }
    }

    const updateQuantity = (productId, newQuantity) => {
        const product = products.find(p => p.id === productId)
        if (newQuantity < 1) {
            removeFromCart(productId)
        } else if (newQuantity <= product.stock) {
            setCart(cart.map(item =>
                item.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            ))
        } else {
            toast.error('Stock insuffisant')
        }
    }

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId))
    }

    const getTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }

    const getTotalItems = () => {
        return cart.reduce((sum, item) => sum + item.quantity, 0)
    }

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Le panier est vide')
            return
        }

        // Vérifier que l'utilisateur est connecté avec un ID valide
        if (!user || !user.id) {
            toast.error('Erreur: Utilisateur non identifié. Veuillez vous reconnecter.')
            return
        }

        setSubmitting(true)

        try {
            // Create a single sale with multiple line items (lignes)
            // L'ID utilisateur est automatiquement pris du profil connecté
            const saleData = {
                userId: user.id,
                lignes: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                }))
            }

            console.log('Creating sale with user ID:', user.id, 'User:', user.username)

            await saleApi.create(saleData)
            toast.success('Vente enregistrée avec succès !')
            setCart([])
            navigate('/vendeur/my-sales')
        } catch (error) {
            console.error('Sale creation error:', error)
            toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Section */}
            <div className="lg:col-span-2 space-y-4">
                <Card className="p-4">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Rechercher un produit..."
                    />
                </Card>

                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredProducts.map((product) => {
                            const inCart = cart.find(item => item.id === product.id)
                            const stockStatus = getStockStatus(product.stock)

                            return (
                                <motion.div
                                    key={product.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Card
                                        className={`overflow-hidden cursor-pointer transition-all ${inCart ? 'ring-2 ring-success-500' : ''
                                            }`}
                                        onClick={() => addToCart(product)}
                                    >
                                        {/* Image */}
                                        <div className="aspect-square bg-dark-100 dark:bg-dark-800 relative overflow-hidden">
                                            {product.imageUrl ? (
                                                <img
                                                    src={getOptimizedImageUrl(product.imageUrl, 300)}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-12 h-12 text-dark-300" />
                                                </div>
                                            )}

                                            {/* In Cart Badge */}
                                            {inCart && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="w-8 h-8 rounded-full bg-success-500 flex items-center justify-center">
                                                        <Check className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Stock Badge */}
                                            <div className="absolute top-2 left-2">
                                                <Badge variant={stockStatus.variant} size="sm">
                                                    Stock: {product.stock}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-3">
                                            <h3 className="font-medium text-dark-900 dark:text-white truncate">
                                                {product.title}
                                            </h3>
                                            <p className="text-xs text-dark-500 truncate">
                                                {product.categoryName}
                                            </p>
                                            <p className="mt-2 text-lg font-bold text-primary-600">
                                                {formatCurrency(product.price)}
                                            </p>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon={Package}
                        title="Aucun produit trouvé"
                        description="Modifiez votre recherche ou attendez le réapprovisionnement"
                    />
                )}
            </div>

            {/* Cart Section */}
            <div className="lg:col-span-1">
                <div className="sticky top-24">
                    <Card className="overflow-hidden">
                        {/* Cart Header */}
                        <div className="p-4 bg-gradient-to-r from-success-500 to-emerald-600">
                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5" />
                                    <span className="font-semibold">Panier</span>
                                </div>
                                <span className="px-2 py-1 bg-white/20 rounded-lg text-sm">
                                    {getTotalItems()} article(s)
                                </span>
                            </div>
                        </div>

                        {/* Cart Items */}
                        <div className="max-h-96 overflow-y-auto">
                            {cart.length > 0 ? (
                                <div className="divide-y divide-gray-200 dark:divide-dark-700">
                                    {cart.map((item) => (
                                        <div key={item.id} className="p-4">
                                            <div className="flex items-start gap-3">
                                                {/* Product Image */}
                                                <div className="w-14 h-14 rounded-lg bg-dark-100 dark:bg-dark-800 overflow-hidden flex-shrink-0">
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={getOptimizedImageUrl(item.imageUrl, 100)}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-6 h-6 text-dark-300" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-dark-900 dark:text-white text-sm truncate">
                                                        {item.title}
                                                    </h4>
                                                    <p className="text-sm text-primary-600 font-medium">
                                                        {formatCurrency(item.price)}
                                                    </p>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity - 1) }}
                                                            className="w-7 h-7 rounded-lg bg-dark-100 dark:bg-dark-700 flex items-center justify-center hover:bg-dark-200 dark:hover:bg-dark-600"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-8 text-center font-medium text-dark-900 dark:text-white">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity + 1) }}
                                                            className="w-7 h-7 rounded-lg bg-dark-100 dark:bg-dark-700 flex items-center justify-center hover:bg-dark-200 dark:hover:bg-dark-600"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Item Total & Remove */}
                                                <div className="text-right">
                                                    <p className="font-semibold text-dark-900 dark:text-white">
                                                        {formatCurrency(item.price * item.quantity)}
                                                    </p>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeFromCart(item.id) }}
                                                        className="p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded mt-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <ShoppingCart className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                                    <p className="text-dark-500">Votre panier est vide</p>
                                    <p className="text-sm text-dark-400 mt-1">
                                        Cliquez sur un produit pour l'ajouter
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Cart Footer */}
                        {cart.length > 0 && (
                            <div className="p-4 border-t border-gray-200 dark:border-dark-700 space-y-4">
                                {/* Total */}
                                <div className="flex items-center justify-between">
                                    <span className="text-dark-500">Total</span>
                                    <span className="text-2xl font-bold text-dark-900 dark:text-white">
                                        {formatCurrency(getTotal())}
                                    </span>
                                </div>

                                {/* Checkout Button */}
                                <Button
                                    onClick={handleCheckout}
                                    loading={submitting}
                                    className="w-full"
                                    size="lg"
                                >
                                    <Receipt className="w-5 h-5 mr-2" />
                                    Valider la vente
                                </Button>

                                {/* Clear Cart */}
                                <button
                                    onClick={() => setCart([])}
                                    className="w-full text-sm text-dark-500 hover:text-danger-500"
                                >
                                    Vider le panier
                                </button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
