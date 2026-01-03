import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart,
    Package, Users, Calendar, ArrowUpRight, ArrowDownRight,
    PieChart, Activity, Target, Zap
} from 'lucide-react'
import { productApi, saleApi, categoryApi, userApi } from '../../api'
import { Card, Loading, Badge } from '../../components/ui'
import { AreaChartComponent, BarChartComponent, PieChartComponent, LineChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('7days')
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalSales: 0,
        totalProducts: 0,
        totalUsers: 0,
        avgOrderValue: 0,
        conversionRate: 0
    })
    const [salesTrend, setSalesTrend] = useState([])
    const [categoryData, setCategoryData] = useState([])
    const [topProducts, setTopProducts] = useState([])
    const [revenueByDay, setRevenueByDay] = useState([])

    useEffect(() => {
        fetchAnalyticsData()
    }, [period])

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true)

            const [productsRes, salesRes, categoriesRes, usersRes] = await Promise.all([
                productApi.getAll().catch(() => ({ data: [] })),
                saleApi.getAll().catch(() => ({ data: [] })),
                categoryApi.getAll().catch(() => ({ data: [] })),
                userApi.getAll().catch(() => ({ data: [] }))
            ])

            const products = productsRes.data || []
            const sales = salesRes.data || []
            const categories = categoriesRes.data || []
            const users = usersRes.data || []

            // Calculate stats
            const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
            const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0

            setStats({
                totalRevenue,
                totalSales: sales.length,
                totalProducts: products.length,
                totalUsers: users.length,
                avgOrderValue,
                conversionRate: 3.2 // Mock
            })

            // Sales trend by day
            const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
            setSalesTrend(days.map((day, i) => ({
                name: day,
                ventes: Math.floor(Math.random() * 50) + 10,
                revenus: Math.floor(Math.random() * 50000) + 10000
            })))

            // Revenue by day
            setRevenueByDay(days.map(day => ({
                name: day,
                value: Math.floor(Math.random() * 80000) + 20000
            })))

            // Category sales distribution
            const catSales = {}
            sales.forEach(sale => {
                if (sale.lignes) {
                    sale.lignes.forEach(ligne => {
                        const product = products.find(p => p.id === ligne.productId)
                        const catName = product?.categoryName || 'Autre'
                        catSales[catName] = (catSales[catName] || 0) + (ligne.lineTotal || 0)
                    })
                }
            })
            setCategoryData(Object.entries(catSales).map(([name, value]) => ({ name, value })))

            // Top products
            const productSales = {}
            sales.forEach(sale => {
                if (sale.lignes) {
                    sale.lignes.forEach(ligne => {
                        const id = ligne.productId
                        if (!productSales[id]) {
                            productSales[id] = {
                                id,
                                name: ligne.productTitle || 'Produit',
                                sales: 0,
                                revenue: 0
                            }
                        }
                        productSales[id].sales += ligne.quantity || 0
                        productSales[id].revenue += ligne.lineTotal || 0
                    })
                }
            })
            setTopProducts(Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5))

        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loading />

    const kpiCards = [
        {
            title: 'Chiffre d\'affaires',
            value: formatCurrency(stats.totalRevenue),
            change: '+12.5%',
            positive: true,
            icon: DollarSign,
            color: 'from-green-500 to-emerald-600'
        },
        {
            title: 'Ventes totales',
            value: formatNumber(stats.totalSales),
            change: '+8.2%',
            positive: true,
            icon: ShoppingCart,
            color: 'from-blue-500 to-cyan-600'
        },
        {
            title: 'Panier moyen',
            value: formatCurrency(stats.avgOrderValue),
            change: '+5.1%',
            positive: true,
            icon: Target,
            color: 'from-purple-500 to-pink-600'
        },
        {
            title: 'Taux de conversion',
            value: `${stats.conversionRate}%`,
            change: '-0.3%',
            positive: false,
            icon: Activity,
            color: 'from-orange-500 to-red-600'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-primary-500" />
                        Analytique
                    </h1>
                    <p className="text-dark-500">Analyse détaillée de vos performances</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm"
                    >
                        <option value="7days">7 derniers jours</option>
                        <option value="30days">30 derniers jours</option>
                        <option value="90days">90 derniers jours</option>
                        <option value="year">Cette année</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((kpi, index) => (
                    <motion.div
                        key={kpi.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className={`p-6 bg-gradient-to-br ${kpi.color} text-white overflow-hidden relative`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <kpi.icon className="w-6 h-6" />
                                    </div>
                                    <Badge
                                        variant={kpi.positive ? 'success' : 'danger'}
                                        className="bg-white/20 text-white border-0"
                                    >
                                        {kpi.positive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                        {kpi.change}
                                    </Badge>
                                </div>
                                <p className="text-white/80 text-sm mb-1">{kpi.title}</p>
                                <p className="text-3xl font-bold">{kpi.value}</p>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                    Évolution des revenus
                                </h3>
                                <p className="text-sm text-dark-500">Tendance sur la période</p>
                            </div>
                            <div className="flex items-center gap-2 text-success-600">
                                <TrendingUp className="w-5 h-5" />
                                <span className="font-semibold">+15.3%</span>
                            </div>
                        </div>
                        <AreaChartComponent
                            data={revenueByDay}
                            dataKey="value"
                            color="#6366F1"
                            height={280}
                        />
                    </Card>
                </motion.div>

                {/* Sales by Category */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                    Répartition par catégorie
                                </h3>
                                <p className="text-sm text-dark-500">Part de marché</p>
                            </div>
                            <PieChart className="w-5 h-5 text-dark-400" />
                        </div>
                        {categoryData.length > 0 ? (
                            <PieChartComponent data={categoryData} height={280} />
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-dark-500">
                                Aucune donnée disponible
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2"
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                    Ventes vs Revenus
                                </h3>
                                <p className="text-sm text-dark-500">Comparaison journalière</p>
                            </div>
                        </div>
                        <BarChartComponent
                            data={salesTrend}
                            dataKey="revenus"
                            color="#10B981"
                            height={280}
                        />
                    </Card>
                </motion.div>

                {/* Top Products */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                Top Produits
                            </h3>
                            <Zap className="w-5 h-5 text-warning-500" />
                        </div>
                        <div className="space-y-4">
                            {topProducts.length > 0 ? (
                                topProducts.map((product, index) => (
                                    <div key={product.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-dark-900 dark:text-white text-sm truncate">
                                                {product.title || product.name}
                                            </p>
                                            <p className="text-xs text-dark-500">
                                                {product.sales} ventes
                                            </p>
                                        </div>
                                        <p className="font-semibold text-success-600 text-sm">
                                            {formatCurrency(product.revenue)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-dark-500 py-8">
                                    Aucune donnée
                                </p>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-6">
                        Résumé rapide
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center p-4 rounded-xl bg-dark-50 dark:bg-dark-800">
                            <Package className="w-8 h-8 mx-auto mb-2 text-primary-500" />
                            <p className="text-2xl font-bold text-dark-900 dark:text-white">
                                {stats.totalProducts}
                            </p>
                            <p className="text-sm text-dark-500">Produits actifs</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-dark-50 dark:bg-dark-800">
                            <Users className="w-8 h-8 mx-auto mb-2 text-success-500" />
                            <p className="text-2xl font-bold text-dark-900 dark:text-white">
                                {stats.totalUsers}
                            </p>
                            <p className="text-sm text-dark-500">Utilisateurs</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-dark-50 dark:bg-dark-800">
                            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-warning-500" />
                            <p className="text-2xl font-bold text-dark-900 dark:text-white">
                                {stats.totalSales}
                            </p>
                            <p className="text-sm text-dark-500">Commandes</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-dark-50 dark:bg-dark-800">
                            <DollarSign className="w-8 h-8 mx-auto mb-2 text-danger-500" />
                            <p className="text-2xl font-bold text-dark-900 dark:text-white">
                                {formatCurrency(stats.avgOrderValue)}
                            </p>
                            <p className="text-sm text-dark-500">Panier moyen</p>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}
