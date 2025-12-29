import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Package, Search, Filter, Grid3X3, List, TrendingUp, TrendingDown,
    DollarSign, ShoppingCart, Box, Tag, Eye, BarChart3, ArrowUpDown,
    ChevronUp, ChevronDown, RefreshCw, Download, Star, AlertTriangle
} from 'lucide-react'
import { analyticsApi, productApi, categoryApi } from '../../api'
import { Card, Button, Input, Loading, Badge, EmptyState } from '../../components/ui'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import toast from 'react-hot-toast'

const VIEW_MODES = [
    { value: 'grid', label: 'Grille', icon: Grid3X3 },
    { value: 'list', label: 'Liste', icon: List },
]

const SORT_OPTIONS = [
    { value: 'revenue', label: 'Chiffre d\'affaires' },
    { value: 'name', label: 'Nom' },
    { value: 'stock', label: 'Stock' },
    { value: 'quantity', label: 'Quantité vendue' },
]

export default function ProductsList() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [viewMode, setViewMode] = useState('grid')
    const [sortBy, setSortBy] = useState('revenue')
    const [sortOrder, setSortOrder] = useState('desc')

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            setLoading(true)

            const [productsRes, bestSellersRes, categoriesRes] = await Promise.all([
                productApi.getAll().catch(() => ({ data: [] })),
                analyticsApi.getBestSellers(100).catch(() => ({ data: [] })),
                categoryApi.getAll().catch(() => ({ data: [] }))
            ])

            const allProducts = productsRes.data?.content || productsRes.data || []
            const bestSellers = bestSellersRes.data || []
            const allCategories = categoriesRes.data || []

            setCategories(allCategories)

            // Créer un map des stats de vente
            const salesStatsMap = {}
            bestSellers.forEach((bs, index) => {
                // Le backend utilise 'title' pour le nom du produit
                const name = (bs.title || bs.productName || bs.name || '').toLowerCase()
                salesStatsMap[name] = {
                    revenue: bs.totalRevenue || bs.revenue || 0,
                    quantity: bs.totalQuantity || bs.quantity || 0,
                    rank: index + 1
                }
                if (bs.productId) {
                    salesStatsMap[bs.productId] = salesStatsMap[name]
                }
            })

            // Calculer le revenu total pour les parts de marché
            const totalRevenue = bestSellers.reduce((sum, p) => sum + (p.totalRevenue || p.revenue || 0), 0)

            // Enrichir les produits avec les stats de vente
            // Le backend retourne: id, asin, title, price, rating, reviewCount, rank, imageUrl, categoryId, categoryName, stock
            const enrichedProducts = allProducts.map((product) => {
                const productName = product.title || product.name || product.productName || 'Produit sans nom'
                const nameLower = productName.toLowerCase()
                const stats = salesStatsMap[nameLower] || salesStatsMap[product.id] || {}

                return {
                    id: product.id,
                    name: productName,
                    asin: product.asin,
                    price: product.price || product.unitPrice || 0,
                    stock: product.stock || 0,
                    rating: product.rating || 0,
                    reviewCount: product.reviewCount || 0,
                    categoryId: product.categoryId || (product.category && product.category.id),
                    categoryName: (product.categoryName && product.categoryName !== 'null')
                        ? product.categoryName
                        : (product.category && product.category.name)
                            ? product.category.name
                            : 'Non classé',
                    description: product.description || '',
                    image: product.imageUrl || product.image,
                    revenue: stats.revenue || 0,
                    quantity: stats.quantity || 0,
                    rank: stats.rank || allProducts.length + 1,
                    marketShare: totalRevenue > 0 ? (stats.revenue || 0) / totalRevenue * 100 : 0
                }
            })

            setProducts(enrichedProducts)
        } catch (error) {
            console.error('Error fetching products:', error)
            toast.error('Erreur lors du chargement des produits')
        } finally {
            setLoading(false)
        }
    }

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = selectedCategory === 'all' || product.categoryId === parseInt(selectedCategory)
            return matchesSearch && matchesCategory
        })

        // Tri
        filtered.sort((a, b) => {
            let comparison = 0
            switch (sortBy) {
                case 'revenue':
                    comparison = a.revenue - b.revenue
                    break
                case 'name':
                    comparison = a.name.localeCompare(b.name)
                    break
                case 'stock':
                    comparison = a.stock - b.stock
                    break
                case 'quantity':
                    comparison = a.quantity - b.quantity
                    break
                default:
                    comparison = 0
            }
            return sortOrder === 'desc' ? -comparison : comparison
        })

        return filtered
    }, [products, searchQuery, selectedCategory, sortBy, sortOrder])

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    }

    const getStockStatus = (stock) => {
        if (stock === 0) return { label: 'Rupture', color: 'danger' }
        if (stock < 10) return { label: 'Faible', color: 'warning' }
        if (stock < 50) return { label: 'Moyen', color: 'secondary' }
        return { label: 'Bon', color: 'success' }
    }

    const exportProducts = () => {
        const csvContent = [
            ['ID', 'Nom', 'Catégorie', 'Prix', 'Stock', 'CA Total', 'Quantité vendue', 'Rang'],
            ...filteredAndSortedProducts.map(p => [
                p.id,
                p.name,
                p.categoryName,
                p.price,
                p.stock,
                p.revenue,
                p.quantity,
                p.rank
            ])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `produits_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        toast.success('Export téléchargé')
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Catalogue Produits
                    </h1>
                    <p className="text-dark-500">{products.length} produits • Cliquez pour voir les statistiques</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchProducts}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualiser
                    </Button>
                    <Button onClick={exportProducts}>
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-dark-400" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                        >
                            <option value="all">Toutes catégories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={toggleSortOrder}
                            className="p-2 rounded-xl border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700"
                        >
                            {sortOrder === 'desc' ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* View Mode */}
                    <div className="flex rounded-xl border border-dark-200 dark:border-dark-700 overflow-hidden">
                        {VIEW_MODES.map(mode => {
                            const Icon = mode.icon
                            return (
                                <button
                                    key={mode.value}
                                    onClick={() => setViewMode(mode.value)}
                                    className={`p-2 ${viewMode === mode.value
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                            )
                        })}
                    </div>
                </div>
            </Card>

            {/* Products Grid/List */}
            {filteredAndSortedProducts.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center">
                        <Package className="w-16 h-16 mx-auto text-dark-300 mb-4" />
                        <h3 className="text-lg font-medium text-dark-700 dark:text-dark-300 mb-2">
                            Aucun produit trouvé
                        </h3>
                        <p className="text-dark-500">Essayez de modifier vos filtres</p>
                    </div>
                </Card>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredAndSortedProducts.map((product, index) => {
                        const stockStatus = getStockStatus(product.stock)
                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    className="p-5 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                                    onClick={() => navigate(`/analyst/products/${product.id}`)}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                                            ) : (
                                                <Package className="w-6 h-6 text-primary-600" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {product.rank <= 3 && (
                                                <Badge variant="warning">
                                                    <Star className="w-3 h-3 mr-1" />
                                                    #{product.rank}
                                                </Badge>
                                            )}
                                            <Badge variant={stockStatus.color}>
                                                {stockStatus.label}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Name & Category */}
                                    <h3 className="font-semibold text-dark-900 dark:text-white mb-1 truncate">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm text-dark-500 mb-4 flex items-center gap-1">
                                        <Tag className="w-3 h-3" />
                                        {product.categoryName}
                                    </p>

                                    {/* Stats */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-dark-500 flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" /> CA
                                            </span>
                                            <span className="font-medium text-dark-900 dark:text-white">
                                                {formatCurrency(product.revenue)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-dark-500 flex items-center gap-1">
                                                <ShoppingCart className="w-3 h-3" /> Vendus
                                            </span>
                                            <span className="font-medium text-dark-900 dark:text-white">
                                                {formatNumber(product.quantity)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-dark-500 flex items-center gap-1">
                                                <Box className="w-3 h-3" /> Stock
                                            </span>
                                            <span className={`font-medium ${product.stock < 10 ? 'text-danger-600' : 'text-dark-900 dark:text-white'}`}>
                                                {product.stock}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700 flex justify-between items-center">
                                        <span className="text-lg font-bold text-primary-600">
                                            {formatCurrency(product.price)}
                                        </span>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="w-4 h-4 mr-1" />
                                            Détails
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-dark-50 dark:bg-dark-800">
                            <tr>
                                <th className="text-left py-4 px-6 text-sm font-medium text-dark-500">Produit</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-dark-500">Catégorie</th>
                                <th className="text-right py-4 px-6 text-sm font-medium text-dark-500">Prix</th>
                                <th className="text-right py-4 px-6 text-sm font-medium text-dark-500">Stock</th>
                                <th className="text-right py-4 px-6 text-sm font-medium text-dark-500">CA Total</th>
                                <th className="text-right py-4 px-6 text-sm font-medium text-dark-500">Vendus</th>
                                <th className="text-center py-4 px-6 text-sm font-medium text-dark-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedProducts.map((product, index) => {
                                const stockStatus = getStockStatus(product.stock)
                                return (
                                    <motion.tr
                                        key={product.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="border-b border-dark-100 dark:border-dark-800 hover:bg-dark-50 dark:hover:bg-dark-800/50 cursor-pointer"
                                        onClick={() => navigate(`/analyst/products/${product.id}`)}
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-8 h-8 object-cover rounded" />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-primary-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-dark-900 dark:text-white">{product.name}</p>
                                                    {product.rank <= 3 && (
                                                        <Badge variant="warning" className="mt-1">
                                                            <Star className="w-3 h-3 mr-1" />Top {product.rank}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-dark-700 dark:text-dark-300">
                                            {product.categoryName}
                                        </td>
                                        <td className="py-4 px-6 text-right font-medium text-dark-900 dark:text-white">
                                            {formatCurrency(product.price)}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Badge variant={stockStatus.color}>
                                                {product.stock}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-6 text-right font-medium text-dark-900 dark:text-white">
                                            {formatCurrency(product.revenue)}
                                        </td>
                                        <td className="py-4 px-6 text-right text-dark-700 dark:text-dark-300">
                                            {formatNumber(product.quantity)}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <Button variant="ghost" size="sm">
                                                <BarChart3 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    )
}
