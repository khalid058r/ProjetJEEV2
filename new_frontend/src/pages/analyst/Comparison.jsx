import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    GitCompare, Plus, X, Search, Check, BarChart3, TrendingUp,
    TrendingDown, Minus, ArrowRight, Package, Tag, DollarSign,
    ShoppingCart, Target, Activity, Percent, Download, RefreshCw
} from 'lucide-react'
import { analyticsApi, productApi, categoryApi } from '../../api'
import { Card, Button, Input, Loading, Badge, EmptyState } from '../../components/ui'
import { BarChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters'
import toast from 'react-hot-toast'

const COMPARISON_TYPES = [
    { value: 'products', label: 'Produits', icon: Package },
    { value: 'categories', label: 'Catégories', icon: Tag },
]

const METRICS = [
    { key: 'revenue', label: 'Chiffre d\'affaires', format: 'currency', icon: DollarSign },
    { key: 'sales', label: 'Nombre de ventes', format: 'number', icon: ShoppingCart },
    { key: 'avgOrder', label: 'Panier moyen', format: 'currency', icon: Target },
    { key: 'growth', label: 'Croissance', format: 'percent', icon: TrendingUp },
    { key: 'marketShare', label: 'Part de marché', format: 'percent', icon: Percent },
]

export default function Comparison() {
    const [loading, setLoading] = useState(true)
    const [comparisonType, setComparisonType] = useState('products')
    const [availableItems, setAvailableItems] = useState([])
    const [selectedItems, setSelectedItems] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showSelector, setShowSelector] = useState(false)

    useEffect(() => {
        fetchData()
    }, [comparisonType])

    const fetchData = async () => {
        try {
            setLoading(true)

            if (comparisonType === 'products') {
                // Récupérer les vrais produits depuis l'API
                const [bestSellersRes, productsRes, monthlyRes] = await Promise.all([
                    analyticsApi.getBestSellers(50).catch(() => ({ data: [] })),
                    productApi.getAll().catch(() => ({ data: [] })),
                    analyticsApi.getMonthlySales().catch(() => ({ data: null }))
                ])

                const bestSellers = bestSellersRes.data || []
                const allProducts = productsRes.data?.content || productsRes.data || []
                const monthly = monthlyRes.data?.list || monthlyRes.data || []

                // Créer un map des stats de vente par produit
                const salesStatsMap = {}
                bestSellers.forEach(bs => {
                    // Backend utilise 'title' pour le nom du produit
                    const name = (bs.title || bs.productName || bs.name || '').toLowerCase()
                    salesStatsMap[name] = {
                        revenue: bs.totalRevenue || bs.revenue || 0,
                        quantity: bs.totalQuantity || bs.quantity || 0
                    }
                    if (bs.productId) {
                        salesStatsMap[bs.productId] = salesStatsMap[name]
                    }
                })

                // Calculer le revenu total pour la part de marché
                const totalRevenue = bestSellers.reduce((sum, p) => sum + (p.totalRevenue || p.revenue || 0), 0)

                // Calculer la croissance globale
                let globalGrowth = 0
                if (monthly.length >= 2) {
                    const current = monthly[monthly.length - 1]?.revenue || monthly[monthly.length - 1]?.totalRevenue || 0
                    const prev = monthly[monthly.length - 2]?.revenue || monthly[monthly.length - 2]?.totalRevenue || 0
                    if (prev > 0) {
                        globalGrowth = ((current - prev) / prev * 100)
                    }
                }

                // Formater les produits avec les vraies données
                // Backend retourne: id, asin, title, price, rating, reviewCount, rank, imageUrl, categoryId, categoryName, stock
                const formattedProducts = allProducts.map((product, index) => {
                    const productName = product.title || product.name || product.productName || `Produit ${index + 1}`
                    const nameLower = productName.toLowerCase()
                    const stats = salesStatsMap[nameLower] || salesStatsMap[product.id] || {}

                    const revenue = stats.revenue || 0
                    const quantity = stats.quantity || 0
                    const stock = product.stock || 0
                    const price = product.price || product.unitPrice || 0

                    // Calcul de la croissance basée sur la performance relative
                    const performanceRatio = totalRevenue > 0 ? (revenue / totalRevenue) : 0
                    const estimatedGrowth = globalGrowth * (performanceRatio * 2 + 0.5)

                    return {
                        id: product.id || index + 1,
                        name: productName,
                        revenue: revenue,
                        sales: quantity,
                        avgOrder: quantity > 0 ? revenue / quantity : price,
                        growth: estimatedGrowth.toFixed(1),
                        marketShare: totalRevenue > 0 ? (revenue / totalRevenue * 100).toFixed(1) : '0',
                        stock: stock,
                        price: price,
                        category: product.categoryName || product.category?.name || 'Non classé'
                    }
                })

                // Trier par revenu décroissant
                formattedProducts.sort((a, b) => b.revenue - a.revenue)

                setAvailableItems(formattedProducts)
                // Auto-select top 2 for comparison
                if (selectedItems.length === 0 && formattedProducts.length >= 2) {
                    setSelectedItems(formattedProducts.slice(0, 2))
                }
            } else {
                // Récupérer les vraies catégories
                const [categoryStatsRes, categoriesRes, monthlyRes] = await Promise.all([
                    analyticsApi.getCategoryStats().catch(() => ({ data: [] })),
                    categoryApi.getAll().catch(() => ({ data: [] })),
                    analyticsApi.getMonthlySales().catch(() => ({ data: null }))
                ])

                const categoryStats = Array.isArray(categoryStatsRes.data)
                    ? categoryStatsRes.data
                    : categoryStatsRes.data?.value || []
                const allCategories = categoriesRes.data || []
                const monthly = monthlyRes.data?.list || monthlyRes.data || []

                // Créer un map des stats par catégorie
                const statsMap = {}
                categoryStats.forEach(cs => {
                    const name = (cs.categoryName || cs.name || '').toLowerCase()
                    statsMap[name] = {
                        revenue: cs.totalRevenue || cs.revenue || 0,
                        salesCount: cs.salesCount || cs.count || 0,
                        productCount: cs.productCount || 0
                    }
                    if (cs.categoryId || cs.id) {
                        statsMap[cs.categoryId || cs.id] = statsMap[name]
                    }
                })

                const totalRevenue = categoryStats.reduce((sum, c) => sum + (c.totalRevenue || c.revenue || 0), 0)

                // Calculer la croissance globale
                let globalGrowth = 0
                if (monthly.length >= 2) {
                    const current = monthly[monthly.length - 1]?.revenue || monthly[monthly.length - 1]?.totalRevenue || 0
                    const prev = monthly[monthly.length - 2]?.revenue || monthly[monthly.length - 2]?.totalRevenue || 0
                    if (prev > 0) {
                        globalGrowth = ((current - prev) / prev * 100)
                    }
                }

                // Utiliser les stats si disponibles, sinon les catégories de base
                const categoriesToUse = categoryStats.length > 0 ? categoryStats : allCategories

                const formattedCategories = categoriesToUse.map((c, index) => {
                    const name = c.categoryName || c.name || `Catégorie ${index + 1}`
                    const nameLower = name.toLowerCase()
                    const stats = statsMap[nameLower] || statsMap[c.id] || {}

                    const revenue = stats.revenue || c.totalRevenue || c.revenue || 0
                    const salesCount = stats.salesCount || c.salesCount || c.count || 0
                    const productCount = stats.productCount || c.productCount || c.products?.length || 0
                    const marketShare = totalRevenue > 0 ? (revenue / totalRevenue * 100) : 0

                    // Estimation de croissance pondérée
                    const estimatedGrowth = globalGrowth * (marketShare / 50 + 0.5)

                    return {
                        id: c.id || c.categoryId || index + 1,
                        name: name,
                        revenue: revenue,
                        sales: salesCount,
                        avgOrder: salesCount > 0 ? revenue / salesCount : 0,
                        growth: estimatedGrowth.toFixed(1),
                        marketShare: marketShare.toFixed(1),
                        productCount: productCount
                    }
                })

                // Trier par revenu décroissant
                formattedCategories.sort((a, b) => b.revenue - a.revenue)

                setAvailableItems(formattedCategories)
                if (selectedItems.length === 0 && formattedCategories.length >= 2) {
                    setSelectedItems(formattedCategories.slice(0, 2))
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Erreur lors du chargement des données')
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = useMemo(() => {
        return availableItems.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !selectedItems.some(s => s.id === item.id)
        )
    }, [availableItems, searchQuery, selectedItems])

    const addItem = (item) => {
        if (selectedItems.length < 4) {
            setSelectedItems([...selectedItems, item])
            setShowSelector(false)
            setSearchQuery('')
        } else {
            toast.error('Maximum 4 éléments à comparer')
        }
    }

    const removeItem = (id) => {
        setSelectedItems(selectedItems.filter(item => item.id !== id))
    }

    const formatValue = (value, format) => {
        switch (format) {
            case 'currency':
                return formatCurrency(value)
            case 'number':
                return formatNumber(value)
            case 'percent':
                return `${value}%`
            default:
                return value
        }
    }

    const getComparisonResult = (metric, item) => {
        const values = selectedItems.map(i => parseFloat(i[metric.key]) || 0)
        const maxValue = Math.max(...values)
        const minValue = Math.min(...values)
        const itemValue = parseFloat(item[metric.key]) || 0

        if (itemValue === maxValue && values.filter(v => v === maxValue).length === 1) {
            return 'best'
        } else if (itemValue === minValue && values.filter(v => v === minValue).length === 1) {
            return 'worst'
        }
        return 'neutral'
    }

    const getRadarData = () => {
        return METRICS.map(metric => {
            const dataPoint = { metric: metric.label }
            selectedItems.forEach((item, index) => {
                const maxValue = Math.max(...availableItems.map(i => parseFloat(i[metric.key]) || 0))
                dataPoint[`item${index}`] = maxValue > 0
                    ? ((parseFloat(item[metric.key]) || 0) / maxValue * 100).toFixed(0)
                    : 0
            })
            return dataPoint
        })
    }

    const getBarComparisonData = () => {
        return selectedItems.map(item => ({
            name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
            revenue: item.revenue,
            sales: item.sales * 100, // Scale for visibility
            growth: parseFloat(item.growth) * 1000 // Scale for visibility
        }))
    }

    const exportComparison = () => {
        const headers = ['Métrique', ...selectedItems.map(i => i.name)]
        const rows = METRICS.map(metric => [
            metric.label,
            ...selectedItems.map(item => formatValue(item[metric.key], metric.format))
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `comparaison_${comparisonType}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        toast.success('Export téléchargé')
    }

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Comparaison
                    </h1>
                    <p className="text-dark-500">Comparez les performances de vos produits et catégories</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualiser
                    </Button>
                    <Button onClick={exportComparison} disabled={selectedItems.length < 2}>
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Type Selector */}
            <Card className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <GitCompare className="w-5 h-5 text-dark-400" />
                        <span className="font-medium text-dark-700 dark:text-dark-300">Comparer:</span>
                    </div>
                    <div className="flex gap-2">
                        {COMPARISON_TYPES.map(type => {
                            const Icon = type.icon
                            return (
                                <button
                                    key={type.value}
                                    onClick={() => {
                                        setComparisonType(type.value)
                                        setSelectedItems([])
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${comparisonType === type.value
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {type.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </Card>

            {/* Selected Items */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-dark-900 dark:text-white">
                        Éléments à comparer ({selectedItems.length}/4)
                    </h3>
                    {selectedItems.length < 4 && (
                        <Button variant="outline" size="sm" onClick={() => setShowSelector(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                    {selectedItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2"
                            style={{ borderColor: colors[index] }}
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: colors[index] }}
                            />
                            <span className="font-medium text-dark-900 dark:text-white">
                                {item.name}
                            </span>
                            <button
                                onClick={() => removeItem(item.id)}
                                className="p-1 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                            >
                                <X className="w-4 h-4 text-dark-400" />
                            </button>
                        </motion.div>
                    ))}

                    {selectedItems.length === 0 && (
                        <div className="text-dark-500 text-sm">
                            Sélectionnez au moins 2 éléments à comparer
                        </div>
                    )}
                </div>

                {/* Item Selector Modal */}
                {showSelector && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-dark-900 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-dark-900 dark:text-white">
                                    Sélectionner un {comparisonType === 'products' ? 'produit' : 'catégorie'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowSelector(false)
                                        setSearchQuery('')
                                    }}
                                    className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-dark-500" />
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {filteredItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => addItem(item)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors text-left"
                                    >
                                        <span className="font-medium text-dark-900 dark:text-white">
                                            {item.name}
                                        </span>
                                        <span className="text-sm text-dark-500">
                                            {formatCurrency(item.revenue)}
                                        </span>
                                    </button>
                                ))}
                                {filteredItems.length === 0 && (
                                    <div className="text-center py-4 text-dark-500">
                                        Aucun élément trouvé
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </Card>

            {/* Comparison Results */}
            {selectedItems.length >= 2 && (
                <>
                    {/* Metrics Comparison Table */}
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-dark-100 dark:border-dark-800">
                            <h3 className="font-semibold text-dark-900 dark:text-white">
                                Comparaison des Métriques
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-50 dark:bg-dark-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-700 dark:text-dark-300">
                                            Métrique
                                        </th>
                                        {selectedItems.map((item, index) => (
                                            <th
                                                key={item.id}
                                                className="px-4 py-3 text-center text-sm font-medium"
                                                style={{ color: colors[index] }}
                                            >
                                                {item.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-100 dark:divide-dark-800">
                                    {METRICS.map((metric) => {
                                        const Icon = metric.icon
                                        return (
                                            <tr key={metric.key} className="hover:bg-dark-50 dark:hover:bg-dark-800/50">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="w-4 h-4 text-dark-400" />
                                                        <span className="font-medium text-dark-900 dark:text-white">
                                                            {metric.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                {selectedItems.map((item, index) => {
                                                    const result = getComparisonResult(metric, item)
                                                    return (
                                                        <td
                                                            key={item.id}
                                                            className="px-4 py-4 text-center"
                                                        >
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className={`font-semibold ${result === 'best'
                                                                    ? 'text-success-600'
                                                                    : result === 'worst'
                                                                        ? 'text-danger-600'
                                                                        : 'text-dark-900 dark:text-white'
                                                                    }`}>
                                                                    {formatValue(item[metric.key], metric.format)}
                                                                </span>
                                                                {result === 'best' && (
                                                                    <TrendingUp className="w-4 h-4 text-success-500" />
                                                                )}
                                                                {result === 'worst' && (
                                                                    <TrendingDown className="w-4 h-4 text-danger-500" />
                                                                )}
                                                            </div>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bar Comparison */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-semibold text-dark-900 dark:text-white">
                                            Comparaison Visuelle
                                        </h3>
                                        <p className="text-sm text-dark-500">CA par élément</p>
                                    </div>
                                    <Badge variant="primary">
                                        <BarChart3 className="w-3 h-3 mr-1" />
                                        Revenue
                                    </Badge>
                                </div>
                                <div className="h-72">
                                    <BarChartComponent
                                        data={getBarComparisonData()}
                                        xAxisKey="name"
                                        dataKey="revenue"
                                        color="#6366f1"
                                        height={280}
                                    />
                                </div>
                            </Card>
                        </motion.div>

                        {/* Performance Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-semibold text-dark-900 dark:text-white">
                                            Résumé de Performance
                                        </h3>
                                        <p className="text-sm text-dark-500">Analyse comparative</p>
                                    </div>
                                    <Badge variant="success">
                                        <Activity className="w-3 h-3 mr-1" />
                                        Score
                                    </Badge>
                                </div>
                                <div className="space-y-4">
                                    {selectedItems.map((item, index) => {
                                        // Calculate overall score
                                        const scores = METRICS.map(m => {
                                            const maxVal = Math.max(...selectedItems.map(i => parseFloat(i[m.key]) || 0))
                                            return maxVal > 0 ? ((parseFloat(item[m.key]) || 0) / maxVal * 100) : 0
                                        })
                                        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

                                        return (
                                            <div key={item.id} className="p-4 rounded-xl bg-dark-50 dark:bg-dark-800">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: colors[index] }}
                                                        />
                                                        <span className="font-medium text-dark-900 dark:text-white">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <Badge variant={avgScore > 70 ? 'success' : avgScore > 40 ? 'warning' : 'danger'}>
                                                        Score: {avgScore.toFixed(0)}%
                                                    </Badge>
                                                </div>
                                                <div className="h-2 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${avgScore}%` }}
                                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: colors[index] }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Winner */}
                                <div className="mt-6 p-4 bg-gradient-to-r from-success-50 to-primary-50 dark:from-success-900/20 dark:to-primary-900/20 rounded-xl border border-success-200 dark:border-success-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-success-500 flex items-center justify-center">
                                            <Check className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-dark-900 dark:text-white">
                                                Meilleur Performer
                                            </p>
                                            <p className="text-sm text-dark-500">
                                                {selectedItems.reduce((best, item) => {
                                                    const itemScore = METRICS.reduce((sum, m) => {
                                                        const maxVal = Math.max(...selectedItems.map(i => parseFloat(i[m.key]) || 0))
                                                        return sum + (maxVal > 0 ? (parseFloat(item[m.key]) || 0) / maxVal : 0)
                                                    }, 0)
                                                    const bestScore = METRICS.reduce((sum, m) => {
                                                        const maxVal = Math.max(...selectedItems.map(i => parseFloat(i[m.key]) || 0))
                                                        return sum + (maxVal > 0 ? (parseFloat(best[m.key]) || 0) / maxVal : 0)
                                                    }, 0)
                                                    return itemScore > bestScore ? item : best
                                                }, selectedItems[0]).name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </>
            )}

            {selectedItems.length < 2 && (
                <EmptyState
                    icon={GitCompare}
                    title="Sélectionnez des éléments"
                    description="Ajoutez au moins 2 éléments pour commencer la comparaison"
                    action={
                        <Button onClick={() => setShowSelector(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter un élément
                        </Button>
                    }
                />
            )}
        </div>
    )
}
