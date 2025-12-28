import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft, Package, ShoppingCart, TrendingUp, DollarSign,
    Edit2, Trash2, Eye, Star, AlertTriangle, BarChart3
} from 'lucide-react'
import { categoryApi, productApi, saleApi } from '../../api'
import { Button, Card, Badge, Loading, Pagination } from '../../components/ui'
import { formatCurrency, getStockStatus } from '../../utils/formatters'
import { getOptimizedImageUrl } from '../../utils/cloudinary'
import toast from 'react-hot-toast'

export default function CategoryDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [category, setCategory] = useState(null)
    const [products, setProducts] = useState([])
    const [allProducts, setAllProducts] = useState([])
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(8)

    useEffect(() => {
        fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [categoryRes, productsRes, salesRes] = await Promise.all([
                categoryApi.getById(id),
                productApi.getAll(),
                saleApi.getAll().catch(() => ({ data: [] }))
            ])

            setCategory(categoryRes.data)
            setAllProducts(productsRes.data || [])

            // Filter products by category
            const categoryProducts = (productsRes.data || []).filter(
                p => p.categoryId === parseInt(id)
            )
            setProducts(categoryProducts)
            setSales(salesRes.data || [])
        } catch (error) {
            toast.error('Erreur lors du chargement')
            navigate('/admin/categories')
        } finally {
            setLoading(false)
        }
    }

    // Stats calculations
    const stats = useMemo(() => {
        const totalProducts = products.length
        const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0)
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock || 0), 0)
        const avgPrice = totalProducts > 0
            ? products.reduce((sum, p) => sum + (p.price || 0), 0) / totalProducts
            : 0
        const lowStockCount = products.filter(p => p.stock <= 10).length
        const outOfStockCount = products.filter(p => p.stock === 0).length

        // Sales stats for this category
        let totalSalesCount = 0
        let totalRevenue = 0
        sales.forEach(sale => {
            sale.lignes?.forEach(ligne => {
                const product = products.find(p => p.id === ligne.productId)
                if (product) {
                    totalSalesCount += ligne.quantity
                    totalRevenue += ligne.quantity * ligne.price
                }
            })
        })

        return {
            totalProducts,
            totalStock,
            totalValue,
            avgPrice,
            lowStockCount,
            outOfStockCount,
            totalSalesCount,
            totalRevenue
        }
    }, [products, sales])

    // Best sellers in category
    const bestSellers = useMemo(() => {
        const productSales = {}
        sales.forEach(sale => {
            sale.lignes?.forEach(ligne => {
                if (products.find(p => p.id === ligne.productId)) {
                    productSales[ligne.productId] = (productSales[ligne.productId] || 0) + ligne.quantity
                }
            })
        })

        return products
            .map(p => ({ ...p, salesCount: productSales[p.id] || 0 }))
            .sort((a, b) => b.salesCount - a.salesCount)
            .slice(0, 5)
    }, [products, sales])

    // Pagination
    const totalPages = Math.ceil(products.length / itemsPerPage)
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return products.slice(start, start + itemsPerPage)
    }, [products, currentPage, itemsPerPage])

    if (loading) return <Loading />

    if (!category) {
        return (
            <div className="text-center py-12">
                <p className="text-dark-500">Catégorie non trouvée</p>
                <Button onClick={() => navigate('/admin/categories')} className="mt-4">
                    Retour aux catégories
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/admin/categories')}
                    className="p-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        {category.name}
                    </h1>
                    {category.description && (
                        <p className="text-dark-500">{category.description}</p>
                    )}
                </div>
                <Button
                    variant="outline"
                    onClick={() => navigate(`/admin/categories`)}
                >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifier
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-primary-100 text-sm">Produits</p>
                            <p className="text-3xl font-bold">{stats.totalProducts}</p>
                        </div>
                        <Package className="w-10 h-10 text-white/30" />
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-success-500 to-emerald-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-success-100 text-sm">Chiffre d'affaires</p>
                            <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                        <DollarSign className="w-10 h-10 text-white/30" />
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-secondary-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-secondary-100 text-sm">Stock total</p>
                            <p className="text-3xl font-bold">{stats.totalStock}</p>
                        </div>
                        <BarChart3 className="w-10 h-10 text-white/30" />
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-warning-500 to-orange-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-warning-100 text-sm">Ventes</p>
                            <p className="text-3xl font-bold">{stats.totalSalesCount}</p>
                        </div>
                        <ShoppingCart className="w-10 h-10 text-white/30" />
                    </div>
                </Card>
            </div>

            {/* Alerts */}
            {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
                <Card className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning-500" />
                        <div>
                            <p className="font-medium text-warning-800 dark:text-warning-200">
                                Alertes de stock
                            </p>
                            <p className="text-sm text-warning-600 dark:text-warning-300">
                                {stats.outOfStockCount > 0 && `${stats.outOfStockCount} en rupture`}
                                {stats.outOfStockCount > 0 && stats.lowStockCount > 0 && ' • '}
                                {stats.lowStockCount > 0 && `${stats.lowStockCount} stock faible`}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Best Sellers */}
                <Card className="p-4">
                    <h3 className="font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-success-500" />
                        Meilleures ventes
                    </h3>
                    <div className="space-y-3">
                        {bestSellers.length > 0 ? (
                            bestSellers.map((product, index) => (
                                <div
                                    key={product.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700"
                                >
                                    <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-xs font-bold flex items-center justify-center">
                                        {index + 1}
                                    </span>
                                    {product.imageUrl ? (
                                        <img
                                            src={getOptimizedImageUrl(product.imageUrl, 40)}
                                            alt={product.title}
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                                            <Package className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate text-dark-900 dark:text-white">
                                            {product.title}
                                        </p>
                                        <p className="text-xs text-dark-500">
                                            {product.salesCount} vendus
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-dark-500 text-center py-4">
                                Aucune vente pour cette catégorie
                            </p>
                        )}
                    </div>
                </Card>

                {/* Products List */}
                <div className="lg:col-span-2">
                    <Card className="p-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary-500" />
                            Produits ({products.length})
                        </h3>

                        {paginatedProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {paginatedProducts.map((product) => {
                                        const stockStatus = getStockStatus(product.stock)
                                        return (
                                            <motion.div
                                                key={product.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-dark-700 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                                                onClick={() => navigate(`/admin/products/${product.id}`)}
                                            >
                                                {product.imageUrl ? (
                                                    <img
                                                        src={getOptimizedImageUrl(product.imageUrl, 60)}
                                                        alt={product.title}
                                                        className="w-14 h-14 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate text-dark-900 dark:text-white">
                                                        {product.title}
                                                    </p>
                                                    <p className="text-sm font-bold text-primary-600">
                                                        {formatCurrency(product.price)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant={stockStatus.variant} className="text-xs">
                                                            {product.stock} en stock
                                                        </Badge>
                                                        {product.rating > 0 && (
                                                            <span className="flex items-center gap-1 text-xs text-dark-500">
                                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                                {product.rating.toFixed(1)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Eye className="w-4 h-4 text-dark-400" />
                                            </motion.div>
                                        )
                                    })}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    itemsPerPage={itemsPerPage}
                                    onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                                    totalItems={products.length}
                                />
                            </>
                        ) : (
                            <p className="text-sm text-dark-500 text-center py-8">
                                Aucun produit dans cette catégorie
                            </p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
