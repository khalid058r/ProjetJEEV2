import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    BarChart3, TrendingUp, TrendingDown, PieChart, LineChart,
    Brain, FileText, Layers, ArrowUpRight, Package, ShoppingCart
} from 'lucide-react'
import { saleApi, productApi, categoryApi, analyticsApi } from '../../api'
import { StatCard, Card, Loading, EmptyState } from '../../components/ui'
import {
    AreaChartComponent, BarChartComponent, PieChartComponent,
    LineChartComponent, MultiBarChartComponent
} from '../../components/charts'
import { formatCurrency, formatNumber, formatCompactNumber } from '../../utils/formatters'

export default function AnalystDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        totalSales: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        growthRate: 12.5
    })
    const [salesByMonth, setSalesByMonth] = useState([])
    const [salesByCategory, setSalesByCategory] = useState([])
    const [topProducts, setTopProducts] = useState([])
    const [categoryComparison, setCategoryComparison] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalyticsData()
    }, [])

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true)

            // Try to fetch from analytics endpoints first
            let dashboardData = null
            let monthlySalesData = null
            let bestSellersData = null
            let categoryStatsData = null

            try {
                const [dashboardRes, monthlyRes, bestSellersRes, categoryRes] = await Promise.all([
                    analyticsApi.getDashboard().catch(() => null),
                    analyticsApi.getMonthlySales().catch(() => null),
                    analyticsApi.getBestSellers(10).catch(() => null),
                    analyticsApi.getCategoryStats().catch(() => null)
                ])

                dashboardData = dashboardRes?.data
                monthlySalesData = monthlyRes?.data
                bestSellersData = bestSellersRes?.data
                categoryStatsData = categoryRes?.data
            } catch (e) {
                console.log('Analytics API not available, using fallback')
            }

            // If analytics API worked, use its data
            if (dashboardData) {
                setStats({
                    totalSales: dashboardData.totalSales || 0,
                    totalRevenue: dashboardData.totalRevenue || 0,
                    avgOrderValue: dashboardData.avgOrderValue || 0,
                    growthRate: dashboardData.growthRate || 12.5
                })
            }

            if (monthlySalesData) {
                setSalesByMonth(monthlySalesData.months?.map((month, i) => ({
                    name: month,
                    revenue: monthlySalesData.revenues?.[i] || 0,
                    ventes: monthlySalesData.counts?.[i] || 0
                })) || [])
            }

            if (bestSellersData) {
                setTopProducts(bestSellersData.map(p => ({
                    name: p.productTitle || p.name,
                    value: p.totalRevenue || p.revenue || 0
                })))
            }

            if (categoryStatsData) {
                setSalesByCategory(categoryStatsData.map(c => ({
                    name: c.categoryName || c.name,
                    value: c.totalRevenue || c.revenue || 0
                })))
            }

            // If analytics API didn't work, fallback to calculating from raw data
            if (!dashboardData) {
                const [salesRes, productsRes, categoriesRes] = await Promise.all([
                    saleApi.getAll(),
                    productApi.getAll(),
                    categoryApi.getAll()
                ])

                const sales = salesRes.data || []
                const products = productsRes.data || []
                const categories = categoriesRes.data || []

                // Calculate stats
                const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                setStats({
                    totalSales: sales.length,
                    totalRevenue,
                    avgOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
                    growthRate: 12.5
                })

                // Sales by month (mock for demonstration)
                const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
                setSalesByMonth(months.map((name, i) => ({
                    name,
                    ventes: Math.floor(Math.random() * 100) + 20,
                    revenue: Math.floor(Math.random() * 100000) + 20000
                })))

                // Build product category map
                const productCategoryMap = {}
                products.forEach(p => {
                    productCategoryMap[p.id] = p.categoryName || 'Autre'
                })

                // Sales by category (from lignes)
                const catSales = {}
                sales.forEach(sale => {
                    if (sale.lignes && Array.isArray(sale.lignes)) {
                        sale.lignes.forEach(ligne => {
                            const catName = productCategoryMap[ligne.productId] || 'Autre'
                            catSales[catName] = (catSales[catName] || 0) + (ligne.lineTotal || 0)
                        })
                    }
                })
                setSalesByCategory(Object.entries(catSales).map(([name, value]) => ({ name, value })))

                // Top products (from lignes)
                const productSales = {}
                sales.forEach(sale => {
                    if (sale.lignes && Array.isArray(sale.lignes)) {
                        sale.lignes.forEach(ligne => {
                            const name = ligne.productTitle || 'Produit'
                            const revenue = ligne.lineTotal || 0
                            if (productSales[name]) {
                                productSales[name].revenue += revenue
                                productSales[name].quantity += ligne.quantity || 1
                            } else {
                                productSales[name] = { name, revenue, quantity: ligne.quantity || 1 }
                            }
                        })
                    }
                })
                setTopProducts(
                    Object.values(productSales)
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 10)
                        .map(p => ({ name: p.name, value: p.revenue }))
                )

                // Category comparison (mock)
                setCategoryComparison(categories.slice(0, 5).map(cat => ({
                    name: cat.name,
                    'Mois actuel': Math.floor(Math.random() * 50000) + 10000,
                    'Mois précédent': Math.floor(Math.random() * 40000) + 8000
                })))
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loading />

    const statCards = [
        {
            title: 'Total Ventes',
            value: formatNumber(stats.totalSales),
            icon: ShoppingCart,
            color: 'primary',
            trend: { value: 8, positive: true }
        },
        {
            title: 'Chiffre d\'Affaires',
            value: formatCompactNumber(stats.totalRevenue) + ' MAD',
            icon: TrendingUp,
            color: 'success',
            trend: { value: stats.growthRate, positive: true }
        },
        {
            title: 'Panier Moyen',
            value: formatCurrency(stats.avgOrderValue),
            icon: BarChart3,
            color: 'secondary'
        },
        {
            title: 'Croissance',
            value: `+${stats.growthRate}%`,
            icon: TrendingUp,
            color: 'warning',
            trend: { value: 3, positive: true }
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Vue Analytique
                    </h1>
                    <p className="text-dark-500">Analyse complète de vos données de ventes</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/analyst/predictions')}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl font-medium transition-colors"
                    >
                        <Brain className="w-5 h-5" />
                        Prédictions IA
                    </button>
                </div>
            </div>

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

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                Tendance des Revenus
                            </h3>
                            <select className="text-sm bg-dark-100 dark:bg-dark-800 border-none rounded-lg px-3 py-1">
                                <option>Cette année</option>
                                <option>6 derniers mois</option>
                            </select>
                        </div>
                        <LineChartComponent
                            data={salesByMonth}
                            dataKey="revenue"
                            color="#6366F1"
                            height={280}
                        />
                    </Card>
                </motion.div>

                {/* Sales Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Distribution par Catégorie
                        </h3>
                        {salesByCategory.length > 0 ? (
                            <PieChartComponent data={salesByCategory} height={280} />
                        ) : (
                            <EmptyState
                                icon={PieChart}
                                title="Pas de données"
                                description="Les données de distribution apparaîtront ici"
                            />
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Category Comparison */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                            Comparaison par Catégorie
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-primary-500" />
                                <span className="text-dark-500">Mois actuel</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-secondary-500" />
                                <span className="text-dark-500">Mois précédent</span>
                            </div>
                        </div>
                    </div>
                    {categoryComparison.length > 0 ? (
                        <MultiBarChartComponent
                            data={categoryComparison}
                            dataKeys={['Mois actuel', 'Mois précédent']}
                            colors={['#6366F1', '#8B5CF6']}
                            height={300}
                        />
                    ) : (
                        <EmptyState
                            icon={BarChart3}
                            title="Pas de données"
                        />
                    )}
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
                            Top 10 Produits par Revenu
                        </h3>
                        <button
                            onClick={() => navigate('/analyst/analytics')}
                            className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                        >
                            Voir détails
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                    {topProducts.length > 0 ? (
                        <BarChartComponent
                            data={topProducts}
                            dataKey="value"
                            color="#10B981"
                            height={300}
                        />
                    ) : (
                        <EmptyState
                            icon={Package}
                            title="Pas de données"
                        />
                    )}
                </Card>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: BarChart3, label: 'Analytique Avancée', href: '/analyst/analytics', color: 'primary' },
                    { icon: Brain, label: 'Prédictions IA', href: '/analyst/predictions', color: 'secondary' },
                    { icon: FileText, label: 'Générer Rapport', href: '/analyst/reports', color: 'success' }
                ].map((action, index) => (
                    <motion.div
                        key={action.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                    >
                        <Card
                            className="p-4 cursor-pointer hover:shadow-lg transition-all"
                            onClick={() => navigate(action.href)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-${action.color}-100 dark:bg-${action.color}-900/30 flex items-center justify-center`}>
                                    <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                                </div>
                                <span className="font-medium text-dark-900 dark:text-white">
                                    {action.label}
                                </span>
                                <ArrowUpRight className="w-4 h-4 text-dark-400 ml-auto" />
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
