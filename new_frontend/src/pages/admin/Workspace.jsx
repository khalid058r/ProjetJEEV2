import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    LayoutGrid, Settings, Plus, X, GripVertical, Package, ShoppingCart,
    Users, TrendingUp, TrendingDown, DollarSign, AlertTriangle, BarChart3, PieChart,
    Calendar, Clock, Target, Activity, Bell, Star, FolderTree, Sparkles,
    ArrowUpRight, ArrowDownRight, RefreshCw, Zap, Award, Eye, ChevronRight,
    CircleDollarSign, Boxes, UserCheck, TrendingDown as TrendDown, Percent,
    CalendarDays, Timer, CheckCircle2, XCircle, Flame, Crown, Medal
} from 'lucide-react'
import { productApi, saleApi, userApi, categoryApi } from '../../api'
import { Card, Button, Loading, Badge, Modal } from '../../components/ui'
import { AreaChartComponent, BarChartComponent, PieChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatRelativeTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

// Available widget types
const WIDGET_TYPES = {
    STATS_PRODUCTS: { id: 'stats_products', title: 'Total Produits', icon: Package, color: 'primary', size: 'small' },
    STATS_SALES: { id: 'stats_sales', title: 'Total Ventes', icon: ShoppingCart, color: 'success', size: 'small' },
    STATS_USERS: { id: 'stats_users', title: 'Utilisateurs', icon: Users, color: 'secondary', size: 'small' },
    STATS_REVENUE: { id: 'stats_revenue', title: 'Chiffre d\'affaires', icon: DollarSign, color: 'warning', size: 'small' },
    STATS_CATEGORIES: { id: 'stats_categories', title: 'Catégories', icon: FolderTree, color: 'info', size: 'small' },
    STATS_AVG_ORDER: { id: 'stats_avg_order', title: 'Panier Moyen', icon: CircleDollarSign, color: 'emerald', size: 'small' },
    LOW_STOCK: { id: 'low_stock', title: 'Alertes Stock', icon: AlertTriangle, color: 'danger', size: 'small' },
    CONVERSION_RATE: { id: 'conversion_rate', title: 'Taux Conversion', icon: Percent, color: 'violet', size: 'small' },
    RECENT_SALES: { id: 'recent_sales', title: 'Ventes Récentes', icon: Clock, size: 'large' },
    SALES_CHART: { id: 'sales_chart', title: 'Tendance Ventes', icon: TrendingUp, size: 'large' },
    TOP_PRODUCTS: { id: 'top_products', title: 'Top Produits', icon: Star, size: 'medium' },
    CATEGORY_CHART: { id: 'category_chart', title: 'Ventes par Catégorie', icon: PieChart, size: 'medium' },
    VENDEUR_PERF: { id: 'vendeur_perf', title: 'Performance Vendeurs', icon: BarChart3, size: 'large' },
    ACTIVITY_FEED: { id: 'activity_feed', title: 'Activité Récente', icon: Activity, size: 'medium' },
    QUICK_ACTIONS: { id: 'quick_actions', title: 'Actions Rapides', icon: Zap, size: 'medium' },
    GOALS_TRACKER: { id: 'goals_tracker', title: 'Objectifs', icon: Target, size: 'medium' },
    TOP_VENDEURS: { id: 'top_vendeurs', title: 'Top Vendeurs', icon: Crown, size: 'medium' },
    STOCK_OVERVIEW: { id: 'stock_overview', title: 'Aperçu Stock', icon: Boxes, size: 'medium' },
    WELCOME_BANNER: { id: 'welcome_banner', title: 'Bannière', icon: Sparkles, size: 'full' },
    LIVE_STATS: { id: 'live_stats', title: 'Stats Live', icon: Activity, size: 'large' }
}

const DEFAULT_LAYOUT = [
    { id: 'welcome_banner', order: 0 },
    { id: 'stats_products', order: 1 },
    { id: 'stats_sales', order: 2 },
    { id: 'stats_users', order: 3 },
    { id: 'stats_revenue', order: 4 },
    { id: 'stats_categories', order: 5 },
    { id: 'stats_avg_order', order: 6 },
    { id: 'low_stock', order: 7 },
    { id: 'conversion_rate', order: 8 },
    { id: 'live_stats', order: 9 },
    { id: 'quick_actions', order: 10 },
    { id: 'goals_tracker', order: 11 },
    { id: 'recent_sales', order: 12 },
    { id: 'sales_chart', order: 13 },
    { id: 'top_products', order: 14 },
    { id: 'category_chart', order: 15 },
    { id: 'top_vendeurs', order: 16 },
    { id: 'stock_overview', order: 17 }
]

export default function Workspace() {
    const [widgets, setWidgets] = useState([])
    const [data, setData] = useState({
        products: [],
        sales: [],
        users: [],
        categories: []
    })
    const [loading, setLoading] = useState(true)
    const [showAddWidget, setShowAddWidget] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        loadLayout()
        fetchData()
        // Update time every minute
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const loadLayout = () => {
        const saved = localStorage.getItem('admin_workspace_layout')
        if (saved) {
            try {
                setWidgets(JSON.parse(saved))
            } catch {
                setWidgets(DEFAULT_LAYOUT)
            }
        } else {
            setWidgets(DEFAULT_LAYOUT)
        }
    }

    const saveLayout = (newWidgets) => {
        setWidgets(newWidgets)
        localStorage.setItem('admin_workspace_layout', JSON.stringify(newWidgets))
    }

    const fetchData = async () => {
        try {
            setLoading(true)
            const [productsRes, salesRes, usersRes, categoriesRes] = await Promise.all([
                productApi.getAll().catch(() => ({ data: [] })),
                saleApi.getAll().catch(() => ({ data: [] })),
                userApi.getAll().catch(() => ({ data: [] })),
                categoryApi.getAll().catch(() => ({ data: [] }))
            ])
            setData({
                products: productsRes.data || [],
                sales: salesRes.data || [],
                users: usersRes.data || [],
                categories: categoriesRes.data || []
            })
        } catch (error) {
            console.error('Erreur lors du chargement:', error)
        } finally {
            setLoading(false)
        }
    }

    const addWidget = (widgetId) => {
        if (widgets.find(w => w.id === widgetId)) {
            toast.error('Widget déjà ajouté')
            return
        }
        const newWidgets = [...widgets, { id: widgetId, order: widgets.length + 1 }]
        saveLayout(newWidgets)
        toast.success('Widget ajouté')
        setShowAddWidget(false)
    }

    const removeWidget = (widgetId) => {
        const newWidgets = widgets.filter(w => w.id !== widgetId)
        saveLayout(newWidgets)
        toast.success('Widget supprimé')
    }

    const moveWidget = (widgetId, direction) => {
        const index = widgets.findIndex(w => w.id === widgetId)
        if (index === -1) return
        if (direction === 'up' && index > 0) {
            const newWidgets = [...widgets]
                ;[newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]]
            saveLayout(newWidgets)
        } else if (direction === 'down' && index < widgets.length - 1) {
            const newWidgets = [...widgets]
                ;[newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]]
            saveLayout(newWidgets)
        }
    }

    const resetLayout = () => {
        saveLayout(DEFAULT_LAYOUT)
        toast.success('Layout réinitialisé')
    }

    // Calculate stats
    const stats = useMemo(() => {
        const products = data.products.length
        const sales = data.sales.length
        const users = data.users.length
        const categories = data.categories.length
        const revenue = data.sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
        const lowStock = data.products.filter(p => p.stock <= 10).length
        const outOfStock = data.products.filter(p => p.stock === 0).length
        const vendeurs = data.users.filter(u => u.role === 'VENDEUR')
        const avgOrderValue = sales > 0 ? revenue / sales : 0
        const totalStock = data.products.reduce((sum, p) => sum + (p.stock || 0), 0)
        const stockValue = data.products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0)

        // Today's stats
        const today = new Date().toDateString()
        const todaySales = data.sales.filter(s => new Date(s.saleDate).toDateString() === today)
        const todayRevenue = todaySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)

        // This week stats
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekSales = data.sales.filter(s => new Date(s.saleDate) >= weekAgo)
        const weekRevenue = weekSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)

        // Conversion simulation (for demo)
        const conversionRate = products > 0 ? Math.min(((sales / products) * 100), 100).toFixed(1) : 0

        return {
            products, sales, users, categories, revenue, lowStock, outOfStock,
            vendeurs, avgOrderValue, totalStock, stockValue, todaySales: todaySales.length,
            todayRevenue, weekSales: weekSales.length, weekRevenue, conversionRate
        }
    }, [data])

    // Recent sales
    const recentSales = [...data.sales]
        .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
        .slice(0, 5)

    // Top products
    const productSales = {}
    data.sales.forEach(sale => {
        sale.lignes?.forEach(ligne => {
            const name = ligne.productTitle || 'Produit'
            productSales[name] = (productSales[name] || 0) + (ligne.lineTotal || 0)
        })
    })
    const topProducts = Object.entries(productSales)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

    // Sales by category
    const categorySales = {}
    data.sales.forEach(sale => {
        sale.lignes?.forEach(ligne => {
            const product = data.products.find(p => p.id === ligne.productId)
            const catName = product?.categoryName || 'Autre'
            categorySales[catName] = (categorySales[catName] || 0) + (ligne.lineTotal || 0)
        })
    })
    const categoryData = Object.entries(categorySales)
        .map(([name, value]) => ({ name, value }))

    // Sales trend
    const salesByMonth = {}
    data.sales.forEach(sale => {
        const month = new Date(sale.saleDate).toLocaleDateString('fr-FR', { month: 'short' })
        if (!salesByMonth[month]) salesByMonth[month] = { ventes: 0, revenue: 0 }
        salesByMonth[month].ventes++
        salesByMonth[month].revenue += sale.totalAmount || 0
    })
    const salesTrend = Object.entries(salesByMonth)
        .map(([name, data]) => ({ name, ...data }))
        .slice(-6)

    // Vendeur performance
    const vendeurPerf = useMemo(() => {
        return stats.vendeurs.map(v => {
            const vendeurSales = data.sales.filter(s => s.userId === v.id)
            return {
                id: v.id,
                name: v.username,
                ventes: vendeurSales.length,
                revenue: vendeurSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
            }
        }).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    }, [data.sales, stats.vendeurs])

    // Stock by category
    const stockByCategory = useMemo(() => {
        const catStock = {}
        data.products.forEach(p => {
            const catName = p.categoryName || 'Autre'
            if (!catStock[catName]) catStock[catName] = { total: 0, lowStock: 0, outOfStock: 0 }
            catStock[catName].total += p.stock || 0
            if (p.stock === 0) catStock[catName].outOfStock++
            else if (p.stock <= 10) catStock[catName].lowStock++
        })
        return Object.entries(catStock).map(([name, data]) => ({ name, ...data }))
    }, [data.products])

    if (loading) return <Loading />

    const renderWidget = (widget) => {
        const config = WIDGET_TYPES[widget.id.toUpperCase()] || WIDGET_TYPES.STATS_PRODUCTS

        switch (widget.id) {
            case 'welcome_banner':
                return (
                    <WelcomeBanner
                        currentTime={currentTime}
                        todaySales={stats.todaySales}
                        todayRevenue={stats.todayRevenue}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                        onRefresh={fetchData}
                    />
                )
            case 'stats_products':
                return (
                    <StatWidget
                        title="Produits"
                        value={formatNumber(stats.products)}
                        icon={Package}
                        color="primary"
                        trend={{ value: 12, positive: true }}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'stats_sales':
                return (
                    <StatWidget
                        title="Ventes"
                        value={formatNumber(stats.sales)}
                        icon={ShoppingCart}
                        color="success"
                        trend={{ value: 8, positive: true }}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'stats_users':
                return (
                    <StatWidget
                        title="Utilisateurs"
                        value={formatNumber(stats.users)}
                        icon={Users}
                        color="secondary"
                        trend={{ value: 5, positive: true }}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'stats_revenue':
                return (
                    <StatWidget
                        title="Chiffre d'affaires"
                        value={formatCurrency(stats.revenue)}
                        icon={DollarSign}
                        color="warning"
                        trend={{ value: 15, positive: true }}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'stats_categories':
                return (
                    <StatWidget
                        title="Catégories"
                        value={formatNumber(stats.categories)}
                        icon={FolderTree}
                        color="info"
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'stats_avg_order':
                return (
                    <StatWidget
                        title="Panier Moyen"
                        value={formatCurrency(stats.avgOrderValue)}
                        icon={CircleDollarSign}
                        color="emerald"
                        trend={{ value: 3, positive: true }}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'low_stock':
                return (
                    <StatWidget
                        title="Stock faible"
                        value={stats.lowStock}
                        icon={AlertTriangle}
                        color="danger"
                        subtitle={`${stats.outOfStock} en rupture`}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                        link="/admin/low-stock"
                    />
                )
            case 'conversion_rate':
                return (
                    <StatWidget
                        title="Taux Conversion"
                        value={`${stats.conversionRate}%`}
                        icon={Percent}
                        color="violet"
                        trend={{ value: 2.5, positive: true }}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'live_stats':
                return (
                    <LiveStatsWidget
                        stats={stats}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'quick_actions':
                return (
                    <QuickActionsWidget
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'goals_tracker':
                return (
                    <GoalsTrackerWidget
                        stats={stats}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'recent_sales':
                return (
                    <LargeWidget
                        title="Ventes Récentes"
                        icon={Clock}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                        link="/admin/sales"
                    >
                        <div className="space-y-3">
                            {recentSales.length > 0 ? recentSales.map((sale, idx) => (
                                <motion.div
                                    key={sale.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-800 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                                            <ShoppingCart className="w-5 h-5 text-success-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-dark-900 dark:text-white">Vente #{sale.id}</p>
                                            <p className="text-sm text-dark-500">{sale.username} • {formatRelativeTime(sale.saleDate)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-success-600">{formatCurrency(sale.totalAmount)}</p>
                                        <p className="text-xs text-dark-400">{sale.lignes?.length || 0} article(s)</p>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-8 text-dark-400">
                                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Aucune vente récente</p>
                                </div>
                            )}
                        </div>
                    </LargeWidget>
                )
            case 'sales_chart':
                return (
                    <LargeWidget
                        title="Tendance des Ventes"
                        icon={TrendingUp}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                        badge={<Badge variant="success" className="text-xs">+15.3%</Badge>}
                    >
                        <div className="h-64">
                            {salesTrend.length > 0 ? (
                                <AreaChartComponent data={salesTrend} dataKeys={['revenue']} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-dark-400">
                                    <p>Pas assez de données</p>
                                </div>
                            )}
                        </div>
                    </LargeWidget>
                )
            case 'top_products':
                return (
                    <MediumWidget
                        title="Top Produits"
                        icon={Star}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                        link="/admin/products"
                    >
                        <div className="space-y-2">
                            {topProducts.length > 0 ? topProducts.map((product, idx) => (
                                <div key={product.title || product.name} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-amber-100 text-amber-600' :
                                        idx === 1 ? 'bg-gray-100 text-gray-600' :
                                            idx === 2 ? 'bg-orange-100 text-orange-600' :
                                                'bg-dark-100 text-dark-500'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-dark-900 dark:text-white truncate">{product.title || product.name}</p>
                                    </div>
                                    <p className="text-sm font-bold text-success-600">{formatCurrency(product.value)}</p>
                                </div>
                            )) : (
                                <p className="text-center text-dark-400 py-4">Aucune donnée</p>
                            )}
                        </div>
                    </MediumWidget>
                )
            case 'category_chart':
                return (
                    <MediumWidget
                        title="Ventes par Catégorie"
                        icon={PieChart}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    >
                        <div className="h-48">
                            {categoryData.length > 0 ? (
                                <PieChartComponent data={categoryData} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-dark-400">
                                    <p>Aucune donnée</p>
                                </div>
                            )}
                        </div>
                    </MediumWidget>
                )
            case 'top_vendeurs':
                return (
                    <TopVendeursWidget
                        vendeurs={vendeurPerf}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'stock_overview':
                return (
                    <StockOverviewWidget
                        stats={stats}
                        stockByCategory={stockByCategory}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'activity_feed':
                return (
                    <ActivityFeedWidget
                        sales={recentSales}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    />
                )
            case 'vendeur_perf':
                return (
                    <LargeWidget
                        title="Performance Vendeurs"
                        icon={BarChart3}
                        editMode={editMode}
                        onRemove={() => removeWidget(widget.id)}
                    >
                        <div className="h-64">
                            {vendeurPerf.length > 0 ? (
                                <BarChartComponent data={vendeurPerf} dataKey="revenue" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-dark-400">
                                    <p>Aucun vendeur</p>
                                </div>
                            )}
                        </div>
                    </LargeWidget>
                )
            default:
                return null
        }
    }

    // Get widget size class
    const getWidgetClass = (widgetId) => {
        if (widgetId === 'welcome_banner') return 'col-span-1 sm:col-span-2 lg:col-span-4'
        if (['sales_chart', 'recent_sales', 'vendeur_perf', 'live_stats'].includes(widgetId)) return 'col-span-1 sm:col-span-2'
        return ''
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                            <LayoutGrid className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                                Workspace
                            </h1>
                            <p className="text-dark-500">Personnalisez votre espace de travail</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <Button variant="ghost" onClick={fetchData} className="p-2.5">
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                    <Button variant={editMode ? 'primary' : 'outline'} onClick={() => setEditMode(!editMode)}>
                        <Settings className="w-4 h-4 mr-2" />
                        {editMode ? 'Terminer' : 'Modifier'}
                    </Button>
                    {editMode && (
                        <>
                            <Button variant="outline" onClick={() => setShowAddWidget(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter
                            </Button>
                            <Button variant="ghost" onClick={resetLayout}>
                                Réinitialiser
                            </Button>
                        </>
                    )}
                </motion.div>
            </div>

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                    {widgets.map((widget, index) => (
                        <motion.div
                            key={widget.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.03, type: "spring", stiffness: 500, damping: 30 }}
                            className={getWidgetClass(widget.id)}
                        >
                            {renderWidget(widget)}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add Widget Modal */}
            <Modal
                isOpen={showAddWidget}
                onClose={() => setShowAddWidget(false)}
                title="Ajouter un widget"
            >
                <div className="grid grid-cols-2 gap-3">
                    {Object.values(WIDGET_TYPES).map(widget => {
                        const isAdded = widgets.some(w => w.id === widget.id)
                        const Icon = widget.icon
                        return (
                            <button
                                key={widget.id}
                                onClick={() => !isAdded && addWidget(widget.id)}
                                disabled={isAdded}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${isAdded
                                    ? 'border-gray-200 dark:border-dark-700 opacity-50 cursor-not-allowed'
                                    : 'border-gray-200 dark:border-dark-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 mb-2 ${isAdded ? 'text-dark-400' : 'text-primary-500'}`} />
                                <p className="font-medium text-dark-900 dark:text-white">{widget.title}</p>
                                {isAdded && (
                                    <Badge variant="default" className="mt-2">Ajouté</Badge>
                                )}
                            </button>
                        )
                    })}
                </div>
            </Modal>
        </div>
    )
}

// Widget Components
function StatWidget({ title, value, icon: Icon, color, trend, subtitle, editMode, onRemove, link }) {
    const colors = {
        primary: 'from-primary-500 to-primary-600',
        success: 'from-success-500 to-emerald-600',
        secondary: 'from-secondary-500 to-purple-600',
        warning: 'from-warning-500 to-orange-600',
        danger: 'from-danger-500 to-red-600',
        info: 'from-cyan-500 to-blue-600',
        emerald: 'from-emerald-500 to-teal-600',
        violet: 'from-violet-500 to-purple-600'
    }

    const content = (
        <Card className={`p-4 bg-gradient-to-br ${colors[color]} text-white relative overflow-hidden group hover:shadow-lg hover:shadow-${color}-500/25 transition-all duration-300`}>
            {/* Decorative circles */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />

            {editMode && (
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove() }}
                    className="absolute top-2 right-2 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors z-10"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
            <div className="relative flex items-center justify-between">
                <div>
                    <p className="text-white/80 text-sm font-medium">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            {trend.positive ? (
                                <ArrowUpRight className="w-4 h-4 text-white/80" />
                            ) : (
                                <ArrowDownRight className="w-4 h-4 text-white/80" />
                            )}
                            <span className="text-sm text-white/80">{trend.value}%</span>
                        </div>
                    )}
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </Card>
    )

    if (link && !editMode) {
        return <Link to={link}>{content}</Link>
    }
    return content
}

function WelcomeBanner({ currentTime, todaySales, todayRevenue, editMode, onRemove, onRefresh }) {
    const hour = currentTime.getHours()
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

    return (
        <Card className="p-6 bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 text-white relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

            {editMode && (
                <button
                    onClick={onRemove}
                    className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors z-10"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <span className="text-white/80 text-sm">
                            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold">{greeting} ! 👋</h2>
                    <p className="text-white/70 mt-1">Voici un aperçu de votre activité aujourd'hui</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                        <p className="text-white/70 text-sm">Ventes aujourd'hui</p>
                        <p className="text-2xl font-bold">{todaySales}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                        <p className="text-white/70 text-sm">Revenu du jour</p>
                        <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
                    </div>
                </div>
            </div>
        </Card>
    )
}

function LiveStatsWidget({ stats, editMode, onRemove }) {
    return (
        <Card className="p-4 relative overflow-hidden">
            {editMode && (
                <button onClick={onRemove} className="absolute top-2 right-2 p-1.5 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 rounded-lg z-10">
                    <X className="w-4 h-4 text-dark-500" />
                </button>
            )}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-success-500"></span>
                    </span>
                    <Activity className="w-5 h-5 text-primary-500" />
                    <h3 className="font-semibold text-dark-900 dark:text-white">Stats en Direct</h3>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-primary-600">{stats.todaySales}</p>
                    <p className="text-xs text-dark-500">Ventes aujourd'hui</p>
                </div>
                <div className="text-center p-3 bg-success-50 dark:bg-success-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-success-600">{formatCurrency(stats.todayRevenue)}</p>
                    <p className="text-xs text-dark-500">Revenu du jour</p>
                </div>
                <div className="text-center p-3 bg-warning-50 dark:bg-warning-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-warning-600">{stats.weekSales}</p>
                    <p className="text-xs text-dark-500">Cette semaine</p>
                </div>
                <div className="text-center p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-secondary-600">{formatCurrency(stats.weekRevenue)}</p>
                    <p className="text-xs text-dark-500">CA semaine</p>
                </div>
            </div>
        </Card>
    )
}

function QuickActionsWidget({ editMode, onRemove }) {
    const actions = [
        { label: 'Nouveau Produit', icon: Package, color: 'primary', href: '/admin/products' },
        { label: 'Nouvelle Vente', icon: ShoppingCart, color: 'success', href: '/admin/sales' },
        { label: 'Analytics', icon: BarChart3, color: 'secondary', href: '/admin/analytics' },
        { label: 'Utilisateurs', icon: Users, color: 'warning', href: '/admin/users' },
    ]

    return (
        <Card className="p-4 relative">
            {editMode && (
                <button onClick={onRemove} className="absolute top-2 right-2 p-1.5 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 rounded-lg z-10">
                    <X className="w-4 h-4 text-dark-500" />
                </button>
            )}
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-warning-500" />
                <h3 className="font-semibold text-dark-900 dark:text-white">Actions Rapides</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {actions.map((action) => (
                    <Link
                        key={action.label}
                        to={action.href}
                        className={`flex items-center gap-2 p-3 rounded-xl bg-${action.color}-50 dark:bg-${action.color}-900/20 hover:bg-${action.color}-100 dark:hover:bg-${action.color}-900/30 transition-colors group`}
                    >
                        <action.icon className={`w-4 h-4 text-${action.color}-600`} />
                        <span className="text-sm font-medium text-dark-700 dark:text-dark-200">{action.label}</span>
                        <ChevronRight className={`w-4 h-4 text-${action.color}-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </Link>
                ))}
            </div>
        </Card>
    )
}

function GoalsTrackerWidget({ stats, editMode, onRemove }) {
    const goals = [
        { label: 'Ventes', current: stats.sales, target: 100, color: 'success' },
        { label: 'Produits', current: stats.products, target: 500, color: 'primary' },
        { label: 'Utilisateurs', current: stats.users, target: 50, color: 'warning' },
    ]

    return (
        <Card className="p-4 relative">
            {editMode && (
                <button onClick={onRemove} className="absolute top-2 right-2 p-1.5 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 rounded-lg z-10">
                    <X className="w-4 h-4 text-dark-500" />
                </button>
            )}
            <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-danger-500" />
                <h3 className="font-semibold text-dark-900 dark:text-white">Objectifs</h3>
            </div>
            <div className="space-y-4">
                {goals.map((goal) => {
                    const percent = Math.min((goal.current / goal.target) * 100, 100)
                    return (
                        <div key={goal.label}>
                            <div className="flex items-center justify-between text-sm mb-1.5">
                                <span className="text-dark-600 dark:text-dark-400">{goal.label}</span>
                                <span className="font-medium text-dark-900 dark:text-white">
                                    {goal.current}/{goal.target}
                                </span>
                            </div>
                            <div className="h-2.5 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent}%` }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                    className={`h-full bg-gradient-to-r from-${goal.color}-500 to-${goal.color}-400 rounded-full`}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}

function TopVendeursWidget({ vendeurs, editMode, onRemove }) {
    const medals = [Crown, Medal, Award]
    const medalColors = ['text-yellow-500', 'text-gray-400', 'text-orange-500']

    return (
        <Card className="p-4 relative">
            {editMode && (
                <button onClick={onRemove} className="absolute top-2 right-2 p-1.5 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 rounded-lg z-10">
                    <X className="w-4 h-4 text-dark-500" />
                </button>
            )}
            <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-dark-900 dark:text-white">Top Vendeurs</h3>
            </div>
            <div className="space-y-3">
                {vendeurs.length > 0 ? vendeurs.slice(0, 3).map((vendeur, idx) => {
                    const MedalIcon = medals[idx] || Star
                    return (
                        <div key={vendeur.id} className="flex items-center gap-3 p-2 rounded-xl bg-dark-50 dark:bg-dark-800">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${idx === 0 ? 'bg-yellow-100' : idx === 1 ? 'bg-gray-100' : 'bg-orange-100'}`}>
                                <MedalIcon className={`w-5 h-5 ${medalColors[idx]}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-dark-900 dark:text-white truncate">{vendeur.name}</p>
                                <p className="text-xs text-dark-500">{vendeur.ventes} ventes</p>
                            </div>
                            <p className="font-bold text-success-600">{formatCurrency(vendeur.revenue)}</p>
                        </div>
                    )
                }) : (
                    <p className="text-center text-dark-400 py-4">Aucun vendeur</p>
                )}
            </div>
        </Card>
    )
}

function StockOverviewWidget({ stats, stockByCategory, editMode, onRemove }) {
    return (
        <Card className="p-4 relative">
            {editMode && (
                <button onClick={onRemove} className="absolute top-2 right-2 p-1.5 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 rounded-lg z-10">
                    <X className="w-4 h-4 text-dark-500" />
                </button>
            )}
            <div className="flex items-center gap-2 mb-4">
                <Boxes className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-dark-900 dark:text-white">Aperçu Stock</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-success-50 dark:bg-success-900/20 rounded-lg">
                    <p className="text-lg font-bold text-success-600">{formatNumber(stats.totalStock)}</p>
                    <p className="text-xs text-dark-500">Total</p>
                </div>
                <div className="text-center p-2 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                    <p className="text-lg font-bold text-warning-600">{stats.lowStock}</p>
                    <p className="text-xs text-dark-500">Faible</p>
                </div>
                <div className="text-center p-2 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                    <p className="text-lg font-bold text-danger-600">{stats.outOfStock}</p>
                    <p className="text-xs text-dark-500">Rupture</p>
                </div>
            </div>

            <div className="text-center p-3 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl">
                <p className="text-xs text-dark-500 mb-1">Valeur du stock</p>
                <p className="text-xl font-bold text-primary-600">{formatCurrency(stats.stockValue)}</p>
            </div>
        </Card>
    )
}

function ActivityFeedWidget({ sales, editMode, onRemove }) {
    return (
        <Card className="p-4 relative">
            {editMode && (
                <button onClick={onRemove} className="absolute top-2 right-2 p-1.5 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 rounded-lg z-10">
                    <X className="w-4 h-4 text-dark-500" />
                </button>
            )}
            <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-dark-900 dark:text-white">Activité</h3>
            </div>
            <div className="space-y-3">
                {sales.slice(0, 4).map((sale, idx) => (
                    <div key={sale.id} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-success-500" />
                        <p className="text-sm text-dark-600 dark:text-dark-300">
                            <span className="font-medium">{sale.username}</span> a effectué une vente
                        </p>
                        <span className="text-xs text-dark-400 ml-auto">{formatRelativeTime(sale.saleDate)}</span>
                    </div>
                ))}
            </div>
        </Card>
    )
}

function LargeWidget({ title, icon: Icon, children, editMode, onRemove, link, badge }) {
    return (
        <Card className="p-4 relative h-full">
            {editMode && (
                <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 p-1.5 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600 rounded-lg transition-colors z-10"
                >
                    <X className="w-4 h-4 text-dark-500" />
                </button>
            )}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-dark-900 dark:text-white">{title}</h3>
                    {badge}
                </div>
                {link && !editMode && (
                    <Link to={link} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                        Voir tout <ChevronRight className="w-4 h-4" />
                    </Link>
                )}
            </div>
            {children}
        </Card>
    )
}

function MediumWidget({ title, icon: Icon, children, editMode, onRemove, link }) {
    return (
        <Card className="p-4 relative h-full">
            {editMode && (
                <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 p-1.5 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600 rounded-lg transition-colors z-10"
                >
                    <X className="w-4 h-4 text-dark-500" />
                </button>
            )}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary-500" />
                    <h3 className="font-semibold text-dark-900 dark:text-white">{title}</h3>
                </div>
                {link && !editMode && (
                    <Link to={link} className="text-xs text-primary-600 hover:underline">
                        Voir tout
                    </Link>
                )}
            </div>
            {children}
        </Card>
    )
}
