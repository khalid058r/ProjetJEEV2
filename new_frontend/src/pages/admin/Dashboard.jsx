import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Package, ShoppingCart, Users, TrendingUp, TrendingDown,
    ArrowUpRight, ArrowDownRight, DollarSign, FolderTree,
    AlertTriangle, Bell, Clock, ExternalLink, Plus, BarChart3,
    Target, Zap, Activity, ArrowRight, Sparkles, CalendarDays,
    CheckCircle2, XCircle, RefreshCw, Crown, Medal, Award
} from 'lucide-react'
import { analyticsApi, saleApi, userApi } from '../../api'
import { StatCard, Card, Loading, EmptyState, AlertBox, Badge } from '../../components/ui'
import { AreaChartComponent, BarChartComponent, PieChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatRelativeTime } from '../../utils/formatters'

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        products: 0,
        categories: 0,
        sales: 0,
        users: 0,
        revenue: 0,
        avgOrderValue: 0,
        todaySales: 0,
        todayRevenue: 0
    })
    const [recentSales, setRecentSales] = useState([])
    const [topProducts, setTopProducts] = useState([])
    const [salesByCategory, setSalesByCategory] = useState([])
    const [salesTrend, setSalesTrend] = useState([])
    const [lowStockProducts, setLowStockProducts] = useState([])
    const [topVendeurs, setTopVendeurs] = useState([])
    const [loading, setLoading] = useState(true)
    const [kpiData, setKpiData] = useState(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // 🚀 Utiliser les endpoints Analytics du backend pour de meilleures performances
            const [
                dashboardRes,
                kpiRes,
                bestSellersRes,
                lowStockRes,
                categoryStatsRes,
                monthlySalesRes,
                recentSalesRes,
                usersRes
            ] = await Promise.all([
                analyticsApi.getDashboard().catch(() => ({ data: null })),
                analyticsApi.getKPI().catch(() => ({ data: null })),
                analyticsApi.getBestSellers(5).catch(() => ({ data: [] })),
                analyticsApi.getLowStockProducts(10).catch(() => ({ data: [] })),
                analyticsApi.getCategoryStats().catch(() => ({ data: [] })),
                analyticsApi.getMonthlySales().catch(() => ({ data: null })),
                saleApi.getAll().catch(() => ({ data: [] })),
                userApi.getAll().catch(() => ({ data: [] }))
            ])

            // Stats depuis le dashboard backend
            const dashboard = dashboardRes.data
            const kpi = kpiRes.data

            // Structure backend: dashboard.kpi.totalProducts, kpi.totals.products, kpi.sales.salesCount
            if (dashboard || kpi) {
                setStats({
                    products: dashboard?.kpi?.totalProducts || kpi?.totals?.products || 0,
                    categories: dashboard?.kpi?.totalCategories || kpi?.totals?.categories || 0,
                    sales: kpi?.sales?.salesCount || 0,
                    users: kpi?.totals?.users || 0,
                    revenue: kpi?.sales?.totalRevenue || 0,
                    avgOrderValue: kpi?.sales?.averageBasket || 0,
                    todaySales: kpi?.sales?.salesCount || 0,
                    todayRevenue: kpi?.sales?.currentMonthRevenue || 0
                })
            }

            setKpiData(kpi)

            // Low stock depuis l'API (plus rapide que filtrer localement)
            // Backend retourne: { value: [...], Count: n }
            const lowStockData = lowStockRes.data?.value || lowStockRes.data || []
            setLowStockProducts(Array.isArray(lowStockData) ? lowStockData : [])

            // Top products depuis l'API (calculé par le backend avec SQL optimisé)
            // Backend retourne: { value: [...], Count: n } ou directement un array
            const bestSellersData = bestSellersRes.data?.value || bestSellersRes.data || []
            const bestSellers = Array.isArray(bestSellersData) ? bestSellersData : []
            setTopProducts(bestSellers.map(p => ({
                name: p.title || p.productName || 'Produit',
                value: p.quantitySold || p.totalSold || p.quantity || 0
            })))

            // Sales by category depuis l'API
            // Backend retourne: { value: [...], Count: n } ou directement un array
            const categoryData = categoryStatsRes.data?.value || categoryStatsRes.data || []
            const categoryStats = Array.isArray(categoryData) ? categoryData : []
            setSalesByCategory(categoryStats.map(c => ({
                name: c.categoryName || c.name || 'Catégorie',
                value: c.totalRevenue || c.revenue || 0
            })))

            // Ventes récentes
            const sales = recentSalesRes.data || []
            const sortedSales = [...sales].sort((a, b) =>
                new Date(b.saleDate) - new Date(a.saleDate)
            )
            setRecentSales(sortedSales.slice(0, 5))

            // Sales trend depuis l'API ou données mensuelles
            // Backend retourne: { list: [...], map: {...} }
            const monthlySales = monthlySalesRes.data
            if (monthlySales && monthlySales.list && monthlySales.list.length > 0) {
                // Utiliser les données mensuelles pour afficher le trend
                setSalesTrend(monthlySales.list.map(m => ({
                    name: m.month || 'Mois',
                    value: m.revenue || 0
                })))
            } else {
                // Fallback: derniers 7 jours depuis les ventes
                const last7Days = getLast7DaysSales(sales)
                setSalesTrend(last7Days)
            }

            // Top Vendeurs - calculer à partir des ventes et des utilisateurs
            const users = usersRes.data || []
            const vendeurs = users.filter(u => u.role === 'VENDEUR')
            const vendeurStats = vendeurs.map(v => {
                const vendeurSales = sales.filter(s => s.userId === v.id)
                return {
                    id: v.id,
                    name: v.username || v.name || 'Vendeur',
                    ventes: vendeurSales.length,
                    revenue: vendeurSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                }
            }).sort((a, b) => b.revenue - a.revenue)
            setTopVendeurs(vendeurStats.slice(0, 3))

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Helper pour calculer les ventes des 7 derniers jours
    const getLast7DaysSales = (sales) => {
        const days = []
        for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            const daySales = sales.filter(s => s.saleDate?.startsWith(dateStr))
            const revenue = daySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
            days.push({
                name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
                value: revenue
            })
        }
        return days
    }

    if (loading) return <Loading />

    const statCards = [
        {
            title: 'Total Produits',
            value: formatNumber(stats.products),
            icon: Package,
            color: 'primary',
            trend: { value: 12, positive: true }
        },
        {
            title: 'Catégories',
            value: formatNumber(stats.categories),
            icon: FolderTree,
            color: 'secondary'
        },
        {
            title: 'Ventes',
            value: formatNumber(stats.sales),
            icon: ShoppingCart,
            color: 'success',
            trend: { value: 8, positive: true }
        },
        {
            title: 'Utilisateurs',
            value: formatNumber(stats.users),
            icon: Users,
            color: 'warning'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Welcome section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                                Tableau de bord
                            </h1>
                            <p className="text-dark-500 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-wrap items-center gap-3"
                >
                    <select className="px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                        <option>7 derniers jours</option>
                        <option>30 derniers jours</option>
                        <option>Ce mois</option>
                        <option>Cette année</option>
                    </select>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={async () => {
                                try {
                                    const response = await analyticsApi.exportCSV({})
                                    const url = window.URL.createObjectURL(new Blob([response.data]))
                                    const link = document.createElement('a')
                                    link.href = url
                                    link.setAttribute('download', 'products_export.csv')
                                    document.body.appendChild(link)
                                    link.click()
                                    link.remove()
                                } catch (e) {
                                    console.error("Export CSV failed", e)
                                }
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-sm font-medium text-dark-700 dark:text-dark-200"
                        >
                            <ArrowDownRight className="w-4 h-4" />
                            CSV
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    const response = await analyticsApi.exportPDF({})
                                    const url = window.URL.createObjectURL(new Blob([response.data]))
                                    const link = document.createElement('a')
                                    link.href = url
                                    link.setAttribute('download', 'products_report.pdf')
                                    document.body.appendChild(link)
                                    link.click()
                                    link.remove()
                                } catch (e) {
                                    console.error("Export PDF failed", e)
                                }
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors text-sm font-medium shadow-lg shadow-primary-500/25"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Rapport PDF
                        </button>
                        <button
                            onClick={fetchDashboardData}
                            className="p-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                            title="Actualiser"
                        >
                            <RefreshCw className="w-5 h-5 text-dark-600 dark:text-dark-300" />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
                {[
                    { label: 'Nouveau Produit', icon: Package, color: 'primary', href: '/admin/products' },
                    { label: 'Nouvelle Vente', icon: ShoppingCart, color: 'success', href: '/admin/sales' },
                    { label: 'Nouvel Utilisateur', icon: Users, color: 'warning', href: '/admin/users' },
                    { label: 'Analytics', icon: BarChart3, color: 'secondary', href: '/admin/analytics' },
                ].map((action, idx) => (
                    <Link
                        key={action.label}
                        to={action.href}
                        className={`group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-${action.color}-500/10 to-${action.color}-600/5 border border-${action.color}-200/50 dark:border-${action.color}-800/50 hover:shadow-lg hover:shadow-${action.color}-500/10 transition-all duration-300`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-${action.color}-100 dark:bg-${action.color}-900/30 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <action.icon className={`w-5 h-5 text-${action.color}-600 dark:text-${action.color}-400`} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-dark-700 dark:text-dark-200 text-sm">{action.label}</p>
                            </div>
                            <Plus className={`w-4 h-4 text-${action.color}-500 opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </div>
                    </Link>
                ))}
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <StatCard {...stat} />
                    </motion.div>
                ))}
            </div>

            {/* Revenue Card + Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2"
                >
                    <Card className="p-6 bg-gradient-to-br from-primary-600 via-primary-600 to-secondary-600 relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

                        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-white/70 text-sm font-medium">Chiffre d'affaires total</p>
                                <p className="text-4xl font-bold text-white mt-2">
                                    {formatCurrency(stats.revenue)}
                                </p>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                                        <TrendingUp className="w-4 h-4" />
                                        +15.3%
                                    </span>
                                    <span className="text-white/70 text-sm">vs mois dernier</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <DollarSign className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Mini stats */}
                        <div className="relative grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
                            <div>
                                <p className="text-white/60 text-xs">Aujourd'hui</p>
                                <p className="text-white font-semibold mt-1">{formatCurrency(stats.revenue * 0.05)}</p>
                            </div>
                            <div>
                                <p className="text-white/60 text-xs">Cette semaine</p>
                                <p className="text-white font-semibold mt-1">{formatCurrency(stats.revenue * 0.25)}</p>
                            </div>
                            <div>
                                <p className="text-white/60 text-xs">Ce mois</p>
                                <p className="text-white font-semibold mt-1">{formatCurrency(stats.revenue * 0.7)}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Top Vendeurs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <Card className="p-6 h-full">
                        <div className="flex items-center gap-2 mb-4">
                            <Crown className="w-5 h-5 text-yellow-500" />
                            <h3 className="font-semibold text-dark-900 dark:text-white">Top Vendeurs</h3>
                        </div>
                        <div className="space-y-3">
                            {topVendeurs.length > 0 ? topVendeurs.map((vendeur, idx) => {
                                const medals = [Crown, Medal, Award]
                                const medalColors = ['text-yellow-500', 'text-gray-400', 'text-orange-500']
                                const MedalIcon = medals[idx] || Medal
                                return (
                                    <div key={vendeur.id} className="flex items-center gap-3 p-2 rounded-xl bg-dark-50 dark:bg-dark-800">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${idx === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : idx === 1 ? 'bg-gray-100 dark:bg-gray-800' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
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
                </motion.div>
            </div>

            {/* Alert Widgets */}
            {lowStockProducts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <AlertBox type="warning" className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-warning-200 dark:border-warning-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-warning-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-warning-800 dark:text-warning-200">
                                        Alerte Stock Faible
                                    </h4>
                                    <p className="text-sm text-warning-600 dark:text-warning-400">
                                        {lowStockProducts.length} produit(s) avec un stock critique
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/admin/low-stock')}
                                className="flex items-center gap-2 px-4 py-2 bg-warning-100 dark:bg-warning-900/30 hover:bg-warning-200 dark:hover:bg-warning-800 text-warning-700 dark:text-warning-300 rounded-xl text-sm font-medium transition-colors"
                            >
                                Voir tout
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="divide-y divide-warning-100 dark:divide-warning-900">
                            {lowStockProducts.slice(0, 3).map((product, index) => (
                                <div
                                    key={product.id || index}
                                    className="flex items-center justify-between p-4 hover:bg-warning-50/50 dark:hover:bg-warning-900/20 cursor-pointer transition-colors"
                                    onClick={() => navigate(`/admin/products/${product.id}`)}
                                >
                                    <div className="flex items-center gap-3">
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.title}
                                                className="w-10 h-10 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-warning-200 dark:bg-warning-800 flex items-center justify-center">
                                                <Package className="w-5 h-5 text-warning-500" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-warning-800 dark:text-warning-200">
                                                {product.title}
                                            </p>
                                            <p className="text-xs text-warning-600 dark:text-warning-400">
                                                {product.categoryName || 'Non catégorisé'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={product.stock === 0 ? 'danger' : 'warning'}
                                        className="font-bold"
                                    >
                                        {product.stock === 0 ? 'Rupture' : `${product.stock} restant${product.stock > 1 ? 's' : ''}`}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </AlertBox>
                </motion.div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Tendance des Ventes
                        </h3>
                        <AreaChartComponent
                            data={salesTrend}
                            dataKey="value"
                            color="#6366F1"
                            height={250}
                        />
                    </Card>
                </motion.div>

                {/* Sales by Category */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Ventes par Catégorie
                        </h3>
                        {salesByCategory.length > 0 ? (
                            <PieChartComponent data={salesByCategory} height={250} />
                        ) : (
                            <EmptyState
                                icon={FolderTree}
                                title="Aucune donnée"
                                description="Les ventes par catégorie apparaîtront ici"
                            />
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Recent Sales & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sales */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                Ventes Récentes
                            </h3>
                            <Link to="/admin/sales" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                                Voir tout
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        {recentSales.length > 0 ? (
                            <div className="space-y-3">
                                {recentSales.map((sale, index) => (
                                    <div
                                        key={sale.id || index}
                                        className="flex items-center justify-between p-3 rounded-xl bg-dark-50 dark:bg-dark-800/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                                                <ShoppingCart className="w-5 h-5 text-success-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-dark-900 dark:text-white">
                                                    {sale.lignes?.[0]?.productTitle || 'Vente #' + sale.id}
                                                    {sale.lignes?.length > 1 && ` (+${sale.lignes.length - 1})`}
                                                </p>
                                                <p className="text-xs text-dark-500">
                                                    {sale.lignes?.reduce((sum, l) => sum + (l.quantity || 0), 0) || 0} article(s) - {sale.username}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-dark-900 dark:text-white">
                                                {formatCurrency(sale.totalAmount || 0)}
                                            </p>
                                            <p className="text-xs text-dark-500">
                                                {formatRelativeTime(sale.saleDate)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={ShoppingCart}
                                title="Aucune vente"
                                description="Les ventes récentes apparaîtront ici"
                            />
                        )}
                    </Card>
                </motion.div>

                {/* Top Products */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                Top Produits
                            </h3>
                            <Link to="/admin/products" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                                Voir tout
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        {topProducts.length > 0 ? (
                            <BarChartComponent
                                data={topProducts}
                                dataKey="value"
                                color="#10B981"
                                height={250}
                            />
                        ) : (
                            <EmptyState
                                icon={Package}
                                title="Aucun produit"
                                description="Les produits les plus vendus apparaîtront ici"
                            />
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Activity Timeline */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
            >
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary-500" />
                            Activité Récente
                        </h3>
                        <span className="text-xs text-dark-500 bg-dark-100 dark:bg-dark-700 px-3 py-1 rounded-full">
                            Dernières 24h
                        </span>
                    </div>
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 via-success-500 to-warning-500 opacity-20" />

                        <div className="space-y-4">
                            {[
                                { type: 'sale', icon: ShoppingCart, color: 'success', title: 'Nouvelle vente effectuée', desc: recentSales[0]?.username ? `Par ${recentSales[0].username}` : 'Vente récente', time: '2 min' },
                                { type: 'product', icon: Package, color: 'primary', title: 'Produit mis à jour', desc: 'Stock modifié', time: '15 min' },
                                { type: 'user', icon: Users, color: 'warning', title: 'Nouvel utilisateur inscrit', desc: 'Bienvenue!', time: '1 heure' },
                                { type: 'alert', icon: AlertTriangle, color: 'danger', title: 'Stock faible détecté', desc: lowStockProducts[0]?.title || 'Produit en rupture', time: '2 heures' },
                            ].map((activity, index) => (
                                <div key={index} className="flex items-start gap-4 relative">
                                    <div className={`w-10 h-10 rounded-xl bg-${activity.color}-100 dark:bg-${activity.color}-900/30 flex items-center justify-center flex-shrink-0 z-10`}>
                                        <activity.icon className={`w-5 h-5 text-${activity.color}-600 dark:text-${activity.color}-400`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium text-dark-900 dark:text-white text-sm truncate">{activity.title}</p>
                                            <span className="text-xs text-dark-400 flex-shrink-0 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {activity.time}
                                            </span>
                                        </div>
                                        <p className="text-xs text-dark-500 mt-0.5">{activity.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Footer Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
                {[
                    { label: 'Taux de conversion', value: '24.8%', icon: Target, change: '+2.4%', positive: true },
                    { label: 'Panier moyen', value: formatCurrency(stats.revenue / Math.max(stats.sales, 1)), icon: ShoppingCart, change: '+5.1%', positive: true },
                    { label: 'Taux de retour', value: '2.3%', icon: RefreshCw, change: '-0.5%', positive: true },
                    { label: 'Satisfaction', value: '4.8/5', icon: Sparkles, change: '+0.2', positive: true },
                ].map((stat, index) => (
                    <Card key={stat.label} className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <stat.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">{stat.label}</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-dark-900 dark:text-white">{stat.value}</p>
                                    <span className={`text-xs ${stat.positive ? 'text-success-600' : 'text-danger-600'}`}>
                                        {stat.change}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </motion.div>
        </div>
    )
}
