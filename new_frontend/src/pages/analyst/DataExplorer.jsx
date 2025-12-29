import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    Search, Filter, Download, RefreshCw, Database, Table, BarChart3,
    PieChart, LineChart, Grid3X3, List, ChevronDown, ChevronUp,
    SortAsc, SortDesc, Eye, FileSpreadsheet, ArrowUpDown, Layers,
    Calendar, Tag, DollarSign, Package, TrendingUp, X, Check
} from 'lucide-react'
import { analyticsApi, productApi, categoryApi, saleApi } from '../../api'
import { Card, Button, Input, Loading, Badge, EmptyState } from '../../components/ui'
import {
    AreaChartComponent, BarChartComponent, PieChartComponent
} from '../../components/charts'
import { formatCurrency, formatNumber, formatDate, formatPercent } from '../../utils/formatters'
import toast from 'react-hot-toast'

const VIEW_MODES = [
    { value: 'table', label: 'Tableau', icon: Table },
    { value: 'cards', label: 'Cartes', icon: Grid3X3 },
    { value: 'chart', label: 'Graphique', icon: BarChart3 },
]

const DATA_SOURCES = [
    { value: 'sales', label: 'Ventes', icon: DollarSign, color: 'primary' },
    { value: 'products', label: 'Produits', icon: Package, color: 'success' },
    { value: 'categories', label: 'Catégories', icon: Tag, color: 'warning' },
    { value: 'trends', label: 'Tendances', icon: TrendingUp, color: 'secondary' },
]

const CHART_TYPES = [
    { value: 'bar', label: 'Barres', icon: BarChart3 },
    { value: 'line', label: 'Lignes', icon: LineChart },
    { value: 'pie', label: 'Camembert', icon: PieChart },
    { value: 'area', label: 'Aires', icon: Layers },
]

export default function DataExplorer() {
    const [loading, setLoading] = useState(true)
    const [dataSource, setDataSource] = useState('sales')
    const [viewMode, setViewMode] = useState('table')
    const [chartType, setChartType] = useState('bar')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
    const [selectedColumns, setSelectedColumns] = useState([])
    const [showColumnPicker, setShowColumnPicker] = useState(false)
    const [dateRange, setDateRange] = useState({ start: '', end: '' })

    const [rawData, setRawData] = useState({
        sales: [],
        products: [],
        categories: [],
        trends: []
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Récupérer les vraies données depuis toutes les APIs
            const [
                kpiRes, monthlyRes, categoryRes, bestSellersRes,
                basketRes, productsRes, salesRes, allCategoriesRes
            ] = await Promise.all([
                analyticsApi.getKPI().catch(() => ({ data: null })),
                analyticsApi.getMonthlySales().catch(() => ({ data: null })),
                analyticsApi.getCategoryStats().catch(() => ({ data: null })),
                analyticsApi.getBestSellers(50).catch(() => ({ data: [] })),
                analyticsApi.getBasketStats().catch(() => ({ data: null })),
                productApi.getAll().catch(() => ({ data: [] })),
                saleApi.getRecent(100).catch(() => ({ data: [] })),
                categoryApi.getAll().catch(() => ({ data: [] }))
            ])

            const kpi = kpiRes.data
            const monthly = monthlyRes.data?.list || monthlyRes.data || []
            const categoryStats = Array.isArray(categoryRes.data)
                ? categoryRes.data
                : categoryRes.data?.value || []
            const bestSellers = bestSellersRes.data || []
            const basketStats = basketRes.data
            const allProducts = productsRes.data?.content || productsRes.data || []
            const recentSales = salesRes.data?.content || salesRes.data || []
            const allCategories = allCategoriesRes.data || []

            // Créer un map des produits avec leur vrai stock
            const productStockMap = {}
            const productRevenueMap = {}
            allProducts.forEach(p => {
                const name = (p.name || p.productName || '').toLowerCase()
                productStockMap[name] = p.stock || p.quantity || 0
                productStockMap[p.id] = p.stock || p.quantity || 0
            })

            // Calculer le revenu par produit depuis les ventes réelles
            recentSales.forEach(sale => {
                const items = sale.items || sale.saleItems || []
                items.forEach(item => {
                    const productId = item.productId || item.product?.id
                    const productName = (item.productName || item.product?.name || '').toLowerCase()
                    const revenue = (item.quantity || 0) * (item.unitPrice || item.price || 0)

                    if (productName) {
                        productRevenueMap[productName] = (productRevenueMap[productName] || 0) + revenue
                    }
                    if (productId) {
                        productRevenueMap[productId] = (productRevenueMap[productId] || 0) + revenue
                    }
                })
            })

            // Generate sales data with real calculations
            const salesData = monthly.map((item, index) => {
                const revenue = item.revenue || item.totalRevenue || 0
                const avgBasket = basketStats?.averageBasket || kpi?.sales?.averageBasket || 150
                const salesCount = item.salesCount || item.count || (avgBasket > 0 ? Math.round(revenue / avgBasket) : 0)

                // Calculer la croissance réelle par rapport au mois précédent
                let growth = 0
                if (index > 0) {
                    const prevRevenue = monthly[index - 1]?.revenue || monthly[index - 1]?.totalRevenue || 0
                    if (prevRevenue > 0) {
                        growth = ((revenue - prevRevenue) / prevRevenue * 100).toFixed(1)
                    }
                }

                return {
                    id: index + 1,
                    month: item.month || `Mois ${index + 1}`,
                    revenue: revenue,
                    salesCount: salesCount,
                    avgOrder: salesCount > 0 ? revenue / salesCount : avgBasket,
                    growth: growth,
                    date: item.date || new Date(2024, index, 1).toISOString()
                }
            })

            // Generate products data with REAL stock from productApi
            // Backend retourne: id, asin, title, price, rating, reviewCount, rank, imageUrl, categoryId, categoryName, stock
            const productsData = allProducts.map((product, index) => {
                const productName = product.title || product.name || product.productName || `Produit ${index + 1}`
                const stock = product.stock || 0
                const price = product.price || product.unitPrice || 0

                // Trouver les stats de vente pour ce produit
                const bestSellerInfo = bestSellers.find(bs =>
                    (bs.title || bs.productName || bs.name || '').toLowerCase() === productName.toLowerCase() ||
                    bs.productId === product.id
                )

                const quantity = bestSellerInfo?.totalQuantity || bestSellerInfo?.quantity || 0
                const revenue = bestSellerInfo?.totalRevenue || bestSellerInfo?.revenue || (quantity * price)

                // Déterminer la tendance basée sur le stock vs ventes
                const trend = stock < 10 ? 'down' : stock > 50 ? 'up' : 'stable'

                return {
                    id: product.id || index + 1,
                    name: productName,
                    revenue: revenue,
                    quantity: quantity,
                    avgPrice: price,
                    stock: stock,
                    category: product.categoryName || product.category?.name || 'Non classé',
                    trend: trend
                }
            })

            // Generate categories data with real data
            const totalCategoryRevenue = categoryStats.reduce((sum, c) => sum + (c.totalRevenue || c.revenue || 0), 0)

            const categoriesData = (categoryStats.length > 0 ? categoryStats : allCategories).map((cat, index) => {
                const revenue = cat.totalRevenue || cat.revenue || 0
                const salesCount = cat.salesCount || cat.count || 0
                const productCount = cat.productCount || cat.products?.length || 0

                // Calculer la croissance réelle
                let growth = 0
                if (monthly.length >= 2) {
                    const currentTotal = monthly[monthly.length - 1]?.revenue || 0
                    const prevTotal = monthly[monthly.length - 2]?.revenue || 0
                    if (prevTotal > 0) {
                        growth = ((currentTotal - prevTotal) / prevTotal * 100).toFixed(1)
                    }
                }

                return {
                    id: cat.id || cat.categoryId || index + 1,
                    name: cat.categoryName || cat.name || `Catégorie ${index + 1}`,
                    revenue: revenue,
                    salesCount: salesCount,
                    productCount: productCount,
                    avgOrderValue: salesCount > 0 ? revenue / salesCount : 0,
                    marketShare: totalCategoryRevenue > 0
                        ? ((revenue / totalCategoryRevenue) * 100).toFixed(1)
                        : 0,
                    growth: growth
                }
            })

            // Generate trends data with real calculations
            const trendsData = monthly.map((item, index) => {
                const revenue = item.revenue || item.totalRevenue || 0
                const previousRevenue = index > 0
                    ? (monthly[index - 1]?.revenue || monthly[index - 1]?.totalRevenue || 0)
                    : revenue * 0.9

                let growth = 0
                if (previousRevenue > 0) {
                    growth = ((revenue - previousRevenue) / previousRevenue * 100).toFixed(1)
                }

                // Prévision basée sur la tendance moyenne
                const avgGrowth = salesData.reduce((sum, s) => sum + parseFloat(s.growth || 0), 0) / (salesData.length || 1)
                const forecast = revenue * (1 + avgGrowth / 100)

                return {
                    id: index + 1,
                    period: item.month || `Mois ${index + 1}`,
                    revenue: revenue,
                    previousRevenue: previousRevenue,
                    growth: growth,
                    forecast: forecast,
                    confidence: avgGrowth > 0 ? 85 : 70
                }
            })

            setRawData({
                sales: salesData,
                products: productsData,
                categories: categoriesData,
                trends: trendsData
            })

            // Set default columns based on data source
            setSelectedColumns(getDefaultColumns('sales'))
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Erreur lors du chargement des données')
        } finally {
            setLoading(false)
        }
    }

    const getDefaultColumns = (source) => {
        const columnSets = {
            sales: ['month', 'revenue', 'salesCount', 'avgOrder', 'growth'],
            products: ['name', 'revenue', 'quantity', 'avgPrice', 'stock'],
            categories: ['name', 'revenue', 'salesCount', 'productCount', 'marketShare'],
            trends: ['period', 'revenue', 'growth', 'forecast', 'confidence']
        }
        return columnSets[source] || []
    }

    const getColumnDefinitions = (source) => {
        const definitions = {
            sales: {
                id: { label: 'ID', type: 'number' },
                month: { label: 'Mois', type: 'string' },
                revenue: { label: 'CA', type: 'currency' },
                salesCount: { label: 'Ventes', type: 'number' },
                avgOrder: { label: 'Panier Moyen', type: 'currency' },
                growth: { label: 'Croissance', type: 'percent' },
                date: { label: 'Date', type: 'date' }
            },
            products: {
                id: { label: 'ID', type: 'number' },
                name: { label: 'Produit', type: 'string' },
                revenue: { label: 'CA', type: 'currency' },
                quantity: { label: 'Quantité', type: 'number' },
                avgPrice: { label: 'Prix Moyen', type: 'currency' },
                stock: { label: 'Stock', type: 'number' },
                category: { label: 'Catégorie', type: 'string' },
                trend: { label: 'Tendance', type: 'badge' }
            },
            categories: {
                id: { label: 'ID', type: 'number' },
                name: { label: 'Catégorie', type: 'string' },
                revenue: { label: 'CA', type: 'currency' },
                salesCount: { label: 'Ventes', type: 'number' },
                productCount: { label: 'Produits', type: 'number' },
                avgOrderValue: { label: 'Panier Moyen', type: 'currency' },
                marketShare: { label: 'Part de Marché', type: 'percent' },
                growth: { label: 'Croissance', type: 'percent' }
            },
            trends: {
                id: { label: 'ID', type: 'number' },
                period: { label: 'Période', type: 'string' },
                revenue: { label: 'CA Actuel', type: 'currency' },
                previousRevenue: { label: 'CA Précédent', type: 'currency' },
                growth: { label: 'Croissance', type: 'percent' },
                forecast: { label: 'Prévision', type: 'currency' },
                confidence: { label: 'Confiance', type: 'percent' }
            }
        }
        return definitions[source] || {}
    }

    const currentData = useMemo(() => {
        let data = [...(rawData[dataSource] || [])]

        // Apply search filter
        if (searchQuery) {
            data = data.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
        }

        // Apply sorting
        if (sortConfig.key) {
            data.sort((a, b) => {
                const aVal = a[sortConfig.key]
                const bVal = b[sortConfig.key]

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
                }

                return sortConfig.direction === 'asc'
                    ? String(aVal).localeCompare(String(bVal))
                    : String(bVal).localeCompare(String(aVal))
            })
        }

        return data
    }, [rawData, dataSource, searchQuery, sortConfig])

    const columnDefs = getColumnDefinitions(dataSource)

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const handleDataSourceChange = (source) => {
        setDataSource(source)
        setSelectedColumns(getDefaultColumns(source))
        setSortConfig({ key: null, direction: 'asc' })
        setSearchQuery('')
    }

    const toggleColumn = (col) => {
        setSelectedColumns(prev =>
            prev.includes(col)
                ? prev.filter(c => c !== col)
                : [...prev, col]
        )
    }

    const formatValue = (value, type) => {
        switch (type) {
            case 'currency':
                return formatCurrency(value)
            case 'number':
                return formatNumber(value)
            case 'percent':
                return `${value}%`
            case 'date':
                return formatDate(value)
            case 'badge':
                return (
                    <Badge variant={value === 'up' ? 'success' : 'danger'}>
                        {value === 'up' ? '↑ Hausse' : '↓ Baisse'}
                    </Badge>
                )
            default:
                return value
        }
    }

    const exportData = (format) => {
        const headers = selectedColumns.map(col => columnDefs[col]?.label || col)
        const rows = currentData.map(item =>
            selectedColumns.map(col => item[col])
        )

        if (format === 'csv') {
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `data_explorer_${dataSource}_${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            toast.success('Export CSV téléchargé')
        }
    }

    const getChartData = () => {
        const xKey = selectedColumns[0] || 'name'
        const yKey = selectedColumns.find(c => columnDefs[c]?.type === 'currency' || columnDefs[c]?.type === 'number') || selectedColumns[1]

        return {
            data: currentData.slice(0, 10),
            xKey,
            yKey
        }
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Explorateur de Données
                    </h1>
                    <p className="text-dark-500">Analysez et visualisez vos données en détail</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualiser
                    </Button>
                    <Button onClick={() => exportData('csv')}>
                        <Download className="w-4 h-4 mr-2" />
                        Exporter CSV
                    </Button>
                </div>
            </div>

            {/* Data Source Selector */}
            <Card className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-dark-400" />
                        <span className="font-medium text-dark-700 dark:text-dark-300">Source:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {DATA_SOURCES.map(source => {
                            const Icon = source.icon
                            const isSelected = dataSource === source.value
                            return (
                                <button
                                    key={source.value}
                                    onClick={() => handleDataSourceChange(source.value)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isSelected
                                        ? `bg-${source.color}-500 text-white`
                                        : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {source.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </Card>

            {/* Toolbar */}
            <Card className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher..."
                                className="w-full pl-10 pr-4 py-2.5 bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* View Mode */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-dark-500">Vue:</span>
                        <div className="flex bg-dark-100 dark:bg-dark-800 rounded-xl p-1">
                            {VIEW_MODES.map(mode => {
                                const Icon = mode.icon
                                return (
                                    <button
                                        key={mode.value}
                                        onClick={() => setViewMode(mode.value)}
                                        className={`p-2 rounded-lg transition-all ${viewMode === mode.value
                                            ? 'bg-white dark:bg-dark-700 shadow text-primary-600'
                                            : 'text-dark-500 hover:text-dark-700'
                                            }`}
                                        title={mode.label}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Chart Type (when in chart view) */}
                    {viewMode === 'chart' && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-dark-500">Graphique:</span>
                            <div className="flex bg-dark-100 dark:bg-dark-800 rounded-xl p-1">
                                {CHART_TYPES.map(type => {
                                    const Icon = type.icon
                                    return (
                                        <button
                                            key={type.value}
                                            onClick={() => setChartType(type.value)}
                                            className={`p-2 rounded-lg transition-all ${chartType === type.value
                                                ? 'bg-white dark:bg-dark-700 shadow text-primary-600'
                                                : 'text-dark-500 hover:text-dark-700'
                                                }`}
                                            title={type.label}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Column Picker */}
                    <div className="relative">
                        <Button
                            variant="outline"
                            onClick={() => setShowColumnPicker(!showColumnPicker)}
                        >
                            <Layers className="w-4 h-4 mr-2" />
                            Colonnes ({selectedColumns.length})
                        </Button>

                        {showColumnPicker && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-900 rounded-xl shadow-xl border border-dark-200 dark:border-dark-700 z-20 p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium text-dark-900 dark:text-white">Colonnes</span>
                                    <button onClick={() => setShowColumnPicker(false)}>
                                        <X className="w-4 h-4 text-dark-400" />
                                    </button>
                                </div>
                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                    {Object.entries(columnDefs).map(([key, def]) => (
                                        <label
                                            key={key}
                                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-800 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedColumns.includes(key)}
                                                onChange={() => toggleColumn(key)}
                                                className="w-4 h-4 rounded text-primary-500"
                                            />
                                            <span className="text-sm text-dark-700 dark:text-dark-300">
                                                {def.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Data Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="text-sm text-dark-500">Total Entrées</div>
                    <div className="text-2xl font-bold text-dark-900 dark:text-white">
                        {formatNumber(currentData.length)}
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-dark-500">Colonnes Affichées</div>
                    <div className="text-2xl font-bold text-dark-900 dark:text-white">
                        {selectedColumns.length}
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-dark-500">Source Active</div>
                    <div className="text-2xl font-bold text-dark-900 dark:text-white capitalize">
                        {DATA_SOURCES.find(s => s.value === dataSource)?.label}
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-dark-500">Tri Actif</div>
                    <div className="text-2xl font-bold text-dark-900 dark:text-white">
                        {sortConfig.key ? columnDefs[sortConfig.key]?.label : 'Aucun'}
                    </div>
                </Card>
            </div>

            {/* Data View */}
            <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {viewMode === 'table' && (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-50 dark:bg-dark-800">
                                    <tr>
                                        {selectedColumns.map(col => (
                                            <th
                                                key={col}
                                                onClick={() => handleSort(col)}
                                                className="px-4 py-3 text-left text-sm font-medium text-dark-700 dark:text-dark-300 cursor-pointer hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {columnDefs[col]?.label || col}
                                                    {sortConfig.key === col ? (
                                                        sortConfig.direction === 'asc' ? (
                                                            <SortAsc className="w-4 h-4" />
                                                        ) : (
                                                            <SortDesc className="w-4 h-4" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="w-4 h-4 opacity-30" />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-100 dark:divide-dark-800">
                                    {currentData.map((item, index) => (
                                        <tr
                                            key={item.id || index}
                                            className="hover:bg-dark-50 dark:hover:bg-dark-800/50 transition-colors"
                                        >
                                            {selectedColumns.map(col => (
                                                <td
                                                    key={col}
                                                    className="px-4 py-3 text-sm text-dark-900 dark:text-white"
                                                >
                                                    {formatValue(item[col], columnDefs[col]?.type)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {currentData.length === 0 && (
                            <div className="p-8 text-center text-dark-500">
                                Aucune donnée trouvée
                            </div>
                        )}
                    </Card>
                )}

                {viewMode === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentData.map((item, index) => (
                            <motion.div
                                key={item.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card className="p-5 hover:shadow-lg transition-shadow">
                                    <div className="space-y-3">
                                        {selectedColumns.map((col, colIndex) => {
                                            const def = columnDefs[col]
                                            return (
                                                <div
                                                    key={col}
                                                    className={`flex items-center justify-between ${colIndex === 0 ? 'pb-3 border-b border-dark-100 dark:border-dark-800' : ''
                                                        }`}
                                                >
                                                    <span className={`text-${colIndex === 0 ? 'sm font-medium' : 'xs'} text-dark-500`}>
                                                        {def?.label || col}
                                                    </span>
                                                    <span className={`${colIndex === 0 ? 'text-lg font-bold' : 'text-sm font-medium'} text-dark-900 dark:text-white`}>
                                                        {formatValue(item[col], def?.type)}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {viewMode === 'chart' && (
                    <Card className="p-6">
                        <div className="h-96">
                            {chartType === 'bar' && (
                                <BarChartComponent
                                    data={getChartData().data}
                                    xAxisKey={getChartData().xKey}
                                    dataKey={getChartData().yKey}
                                    color="#6366f1"
                                    height={380}
                                />
                            )}
                            {chartType === 'area' && (
                                <AreaChartComponent
                                    data={getChartData().data}
                                    xAxisKey={getChartData().xKey}
                                    dataKey={getChartData().yKey}
                                    color="#6366f1"
                                    height={380}
                                />
                            )}
                            {chartType === 'pie' && (
                                <PieChartComponent
                                    data={getChartData().data.map(d => ({
                                        name: d[getChartData().xKey],
                                        value: d[getChartData().yKey]
                                    }))}
                                    height={380}
                                />
                            )}
                            {chartType === 'line' && (
                                <AreaChartComponent
                                    data={getChartData().data}
                                    xAxisKey={getChartData().xKey}
                                    dataKey={getChartData().yKey}
                                    color="#10b981"
                                    height={380}
                                />
                            )}
                        </div>
                    </Card>
                )}
            </motion.div>
        </div>
    )
}
