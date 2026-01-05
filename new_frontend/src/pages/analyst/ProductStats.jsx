import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft, Package, DollarSign, ShoppingCart, TrendingUp, TrendingDown,
    BarChart3, PieChart, Activity, Target, Box, Tag, Calendar,
    Download, RefreshCw, Star, AlertTriangle, CheckCircle, XCircle, Brain
} from 'lucide-react'
import { analyticsApi, productApi, saleApi } from '../../api'
import { Card, Button, Loading, Badge } from '../../components/ui'
import {
    AreaChartComponent, BarChartComponent, LineChartComponent
} from '../../components/charts'
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function ProductStats() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [salesApiError, setSalesApiError] = useState(false)
    const [product, setProduct] = useState(null)
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalQuantity: 0,
        avgPrice: 0,
        salesCount: 0,
        marketShare: 0,
        growth: 0,
        rank: 0,
        monthlySales: [],
        recentSales: []
    })

    useEffect(() => {
        if (id) {
            fetchProductStats()
        }
    }, [id])

    const fetchProductStats = async () => {
        try {
            setLoading(true)
            setSalesApiError(false)

            const [productRes, bestSellersRes, monthlyRes, salesRes] = await Promise.all([
                productApi.getById(id).catch(() => ({ data: null })),
                analyticsApi.getBestSellers(100).catch(() => ({ data: [] })),
                analyticsApi.getMonthlySales().catch(() => ({ data: null })),
                saleApi.getRecent(200).catch(() => {
                    setSalesApiError(true)
                    return { data: [] }
                })
            ])

            const productData = productRes.data
            const bestSellers = bestSellersRes.data || []
            const monthly = monthlyRes.data?.list || monthlyRes.data || []
            const allSales = salesRes.data?.content || salesRes.data || []

            if (!productData) {
                toast.error('Produit non trouvé')
                navigate('/analyst/products')
                return
            }

            // Normaliser les données du produit (backend utilise 'title' pour le nom)
            const normalizedProduct = {
                ...productData,
                name: productData.title || productData.name || productData.productName || 'Produit',
                image: productData.imageUrl || productData.image
            }

            setProduct(normalizedProduct)

            // Le nom du produit pour la recherche
            const productName = normalizedProduct.name.toLowerCase()

            // Trouver les stats du produit dans les best sellers
            const productStats = bestSellers.find(bs =>
                bs.productId === parseInt(id) ||
                (bs.title || bs.productName || bs.name || '').toLowerCase() === productName
            )

            // Calculer le rang du produit
            const rank = bestSellers.findIndex(bs =>
                bs.productId === parseInt(id) ||
                (bs.title || bs.productName || bs.name || '').toLowerCase() === productName
            ) + 1

            // Calculer le revenu total pour la part de marché
            const totalMarketRevenue = bestSellers.reduce((sum, p) => sum + (p.totalRevenue || p.revenue || 0), 0)

            // Filtrer les ventes qui contiennent ce produit
            const productSales = allSales.filter(sale => {
                const items = sale.items || sale.saleItems || []
                return items.some(item =>
                    item.productId === parseInt(id) ||
                    item.product?.id === parseInt(id) ||
                    (item.productName || item.product?.name || '').toLowerCase() === (productData.name || '').toLowerCase()
                )
            })

            // Calculer les ventes mensuelles pour ce produit
            const monthlySalesMap = {}
            productSales.forEach(sale => {
                const date = new Date(sale.date || sale.createdAt)
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })

                const items = sale.items || sale.saleItems || []
                const productItem = items.find(item =>
                    item.productId === parseInt(id) ||
                    item.product?.id === parseInt(id)
                )

                if (productItem) {
                    if (!monthlySalesMap[monthKey]) {
                        monthlySalesMap[monthKey] = { month: monthName, revenue: 0, quantity: 0 }
                    }
                    monthlySalesMap[monthKey].revenue += (productItem.quantity || 0) * (productItem.unitPrice || productItem.price || 0)
                    monthlySalesMap[monthKey].quantity += productItem.quantity || 0
                }
            })

            const monthlySalesData = Object.values(monthlySalesMap).slice(-12)

            // Calculer la croissance
            let growth = 0
            if (monthlySalesData.length >= 2) {
                const current = monthlySalesData[monthlySalesData.length - 1]?.revenue || 0
                const prev = monthlySalesData[monthlySalesData.length - 2]?.revenue || 0
                if (prev > 0) {
                    growth = ((current - prev) / prev * 100)
                }
            }

            const totalRevenue = productStats?.totalRevenue || productStats?.revenue || 0
            const totalQuantity = productStats?.totalQuantity || productStats?.quantity || 0

            setStats({
                totalRevenue: totalRevenue,
                totalQuantity: totalQuantity,
                avgPrice: totalQuantity > 0 ? totalRevenue / totalQuantity : productData.price || 0,
                salesCount: productSales.length,
                marketShare: totalMarketRevenue > 0 ? (totalRevenue / totalMarketRevenue * 100) : 0,
                growth: growth,
                rank: rank || bestSellers.length + 1,
                totalProducts: bestSellers.length,
                monthlySales: monthlySalesData,
                recentSales: productSales.slice(0, 10).map(sale => ({
                    id: sale.id,
                    date: sale.date || sale.createdAt,
                    quantity: (sale.items || sale.saleItems || []).find(i =>
                        i.productId === parseInt(id) || i.product?.id === parseInt(id)
                    )?.quantity || 0,
                    total: (sale.items || sale.saleItems || []).find(i =>
                        i.productId === parseInt(id) || i.product?.id === parseInt(id)
                    )?.quantity * (sale.items || sale.saleItems || []).find(i =>
                        i.productId === parseInt(id) || i.product?.id === parseInt(id)
                    )?.unitPrice || 0,
                    client: sale.clientName || sale.client?.name || 'Client'
                }))
            })
        } catch (error) {
            console.error('Error fetching product stats:', error)
            toast.error('Erreur lors du chargement des statistiques')
        } finally {
            setLoading(false)
        }
    }

    const getStockStatus = () => {
        const stock = product?.stock || 0
        if (stock === 0) return { label: 'Rupture', color: 'danger', icon: XCircle }
        if (stock < 10) return { label: 'Stock faible', color: 'warning', icon: AlertTriangle }
        return { label: 'En stock', color: 'success', icon: CheckCircle }
    }

    const exportStats = () => {
        if (!product) return

        const csvContent = [
            ['Statistiques du produit', product.name],
            [''],
            ['Métrique', 'Valeur'],
            ['Chiffre d\'affaires total', stats.totalRevenue],
            ['Quantité vendue', stats.totalQuantity],
            ['Prix moyen', stats.avgPrice],
            ['Nombre de ventes', stats.salesCount],
            ['Part de marché', `${stats.marketShare.toFixed(1)}%`],
            ['Croissance', `${stats.growth.toFixed(1)}%`],
            ['Classement', `${stats.rank}/${stats.totalProducts}`],
            ['Stock actuel', product.stock || 0],
            [''],
            ['Ventes mensuelles'],
            ['Mois', 'Revenu', 'Quantité'],
            ...stats.monthlySales.map(m => [m.month, m.revenue, m.quantity])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `stats_${product.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        toast.success('Export téléchargé')
    }

    if (loading) return <Loading />

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Package className="w-16 h-16 text-dark-300 mb-4" />
                <p className="text-dark-500">Produit non trouvé</p>
                <Button onClick={() => navigate('/analyst/products')} className="mt-4">
                    Retour aux produits
                </Button>
            </div>
        )
    }

    const stockStatus = getStockStatus()
    const StockIcon = stockStatus.icon

    return (
        <div className="space-y-6">
            {salesApiError && (
                <div className="text-red-500 mb-2">
                    Impossible de charger les ventes récentes (erreur serveur).
                </div>
            )}
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => navigate('/analyst/products')}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                            {product.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="primary">
                                <Tag className="w-3 h-3 mr-1" />
                                {(product.categoryName && product.categoryName !== 'null')
                                    ? product.categoryName
                                    : (product.category && product.category.name)
                                        ? product.category.name
                                        : 'Non classé'}
                            </Badge>
                            <Badge variant={stockStatus.color}>
                                <StockIcon className="w-3 h-3 mr-1" />
                                {stockStatus.label} ({product.stock || 0})
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="secondary" 
                        onClick={() => navigate(`/analyst/products/${id}/ml`)}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                    >
                        <Brain className="w-4 h-4 mr-2" />
                        Prédictions ML
                    </Button>
                    <Button variant="outline" onClick={fetchProductStats}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualiser
                    </Button>
                    <Button onClick={exportStats}>
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Chiffre d\'affaires',
                        value: formatCurrency(stats.totalRevenue),
                        icon: DollarSign,
                        color: 'primary',
                        subtext: `${stats.marketShare.toFixed(1)}% du marché`
                    },
                    {
                        label: 'Quantité vendue',
                        value: formatNumber(stats.totalQuantity),
                        icon: ShoppingCart,
                        color: 'success',
                        subtext: `${stats.salesCount} transactions`
                    },
                    {
                        label: 'Prix moyen',
                        value: formatCurrency(stats.avgPrice),
                        icon: Target,
                        color: 'warning',
                        subtext: `Prix catalogue: ${formatCurrency(product.price || 0)}`
                    },
                    {
                        label: 'Classement',
                        value: `#${stats.rank}`,
                        icon: Star,
                        color: stats.rank <= 3 ? 'success' : stats.rank <= 10 ? 'warning' : 'secondary',
                        subtext: `sur ${stats.totalProducts} produits`
                    }
                ].map((kpi, index) => {
                    const Icon = kpi.icon
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-12 h-12 rounded-xl bg-${kpi.color}-100 dark:bg-${kpi.color}-900/30 flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 text-${kpi.color}-600`} />
                                    </div>
                                    {kpi.label === 'Chiffre d\'affaires' && (
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stats.growth >= 0
                                            ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                                            : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                                            }`}>
                                            {stats.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {Math.abs(stats.growth).toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-dark-500 mb-1">{kpi.label}</p>
                                <p className="text-2xl font-bold text-dark-900 dark:text-white">{kpi.value}</p>
                                <p className="text-xs text-dark-400 mt-1">{kpi.subtext}</p>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Sales Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-semibold text-dark-900 dark:text-white">
                                    Évolution des ventes
                                </h3>
                                <p className="text-sm text-dark-500">Revenus mensuels</p>
                            </div>
                            <Badge variant="primary">
                                <BarChart3 className="w-3 h-3 mr-1" />
                                Mensuel
                            </Badge>
                        </div>
                        {stats.monthlySales.length > 0 ? (
                            <div className="h-72">
                                <AreaChartComponent
                                    data={stats.monthlySales}
                                    xAxisKey="month"
                                    dataKey="revenue"
                                    color="#6366f1"
                                    height={280}
                                />
                            </div>
                        ) : (
                            <div className="h-72 flex items-center justify-center text-dark-400">
                                <div className="text-center">
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Pas de données de ventes</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </motion.div>

                {/* Quantity Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-semibold text-dark-900 dark:text-white">
                                    Quantités vendues
                                </h3>
                                <p className="text-sm text-dark-500">Unités par mois</p>
                            </div>
                            <Badge variant="success">
                                <Box className="w-3 h-3 mr-1" />
                                Quantité
                            </Badge>
                        </div>
                        {stats.monthlySales.length > 0 ? (
                            <div className="h-72">
                                <BarChartComponent
                                    data={stats.monthlySales}
                                    xAxisKey="month"
                                    dataKey="quantity"
                                    color="#10b981"
                                    height={280}
                                />
                            </div>
                        ) : (
                            <div className="h-72 flex items-center justify-center text-dark-400">
                                <div className="text-center">
                                    <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Pas de données de quantités</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Recent Sales */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-semibold text-dark-900 dark:text-white">
                                Ventes récentes
                            </h3>
                            <p className="text-sm text-dark-500">Dernières transactions pour ce produit</p>
                        </div>
                        <Badge variant="secondary">
                            <Calendar className="w-3 h-3 mr-1" />
                            {stats.recentSales.length} ventes
                        </Badge>
                    </div>
                    {stats.recentSales.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-dark-200 dark:border-dark-700">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-dark-500">Date</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-dark-500">Client</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Quantité</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentSales.map((sale, index) => (
                                        <tr key={index} className="border-b border-dark-100 dark:border-dark-800 hover:bg-dark-50 dark:hover:bg-dark-800/50">
                                            <td className="py-3 px-4 text-sm text-dark-700 dark:text-dark-300">
                                                {new Date(sale.date).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-dark-700 dark:text-dark-300">
                                                {sale.client}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-dark-700 dark:text-dark-300 text-right">
                                                {sale.quantity}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-dark-900 dark:text-white text-right">
                                                {formatCurrency(sale.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-dark-400">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Aucune vente récente pour ce produit</p>
                        </div>
                    )}
                </Card>
            </motion.div>

            {/* Product Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <Card className="p-6">
                    <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                        Informations du produit
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <p className="text-sm text-dark-500 mb-1">Prix catalogue</p>
                            <p className="text-lg font-semibold text-dark-900 dark:text-white">
                                {formatCurrency(product.price || 0)}
                            </p>
                        </div>
                        <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <p className="text-sm text-dark-500 mb-1">Stock disponible</p>
                            <p className="text-lg font-semibold text-dark-900 dark:text-white">
                                {product.stock || 0} unités
                            </p>
                        </div>
                        <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <p className="text-sm text-dark-500 mb-1">Catégorie</p>
                            <p className="text-lg font-semibold text-dark-900 dark:text-white">
                                {(product.categoryName && product.categoryName !== 'null')
                                    ? product.categoryName
                                    : (product.category && product.category.name)
                                        ? product.category.name
                                        : 'Non classé'}
                            </p>
                        </div>
                        <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <p className="text-sm text-dark-500 mb-1">ID Produit</p>
                            <p className="text-lg font-semibold text-dark-900 dark:text-white">
                                #{product.id}
                            </p>
                        </div>
                    </div>
                    {product.description && (
                        <div className="mt-4 p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <p className="text-sm text-dark-500 mb-1">Description</p>
                            <p className="text-dark-700 dark:text-dark-300">{product.description}</p>
                        </div>
                    )}
                </Card>
            </motion.div>
        </div>
    )
}
