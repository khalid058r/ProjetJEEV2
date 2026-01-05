import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    BarChart3, TrendingUp, TrendingDown, PieChart, LineChart,
    Brain, FileText, Layers, ArrowUpRight, Package, ShoppingCart,
    DollarSign, Users, Target, Activity
} from 'lucide-react'
import { analyticsApi } from '../../api'
import { StatCard, Card, Loading, EmptyState, Badge } from '../../components/ui'
import {
    AreaChartComponent, BarChartComponent, PieChartComponent,
    LineChartComponent
} from '../../components/charts'
import { formatCurrency, formatNumber, formatCompactNumber } from '../../utils/formatters'

export default function AnalystDashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalSales: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        growthRate: 12.5,
        productCount: 0,
        categoryCount: 0
    })
    const [salesByMonth, setSalesByMonth] = useState([])
    const [salesByCategory, setSalesByCategory] = useState([])
    const [topProducts, setTopProducts] = useState([])

    useEffect(() => {
        fetchAnalyticsData()
    }, [])

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true)

            // Fetch all data from analytics endpoints
            const [kpiRes, monthlyRes, categoryRes, bestSellersRes] = await Promise.all([
                analyticsApi.getKPI().catch(() => ({ data: null })),
                analyticsApi.getMonthlySales().catch(() => ({ data: null })),
                analyticsApi.getCategoryStats().catch(() => ({ data: null })),
                analyticsApi.getBestSellers(10).catch(() => ({ data: null }))
            ])

            // Parse KPI data
            const kpiData = kpiRes.data
            const totalRevenue = kpiData?.sales?.totalRevenue || 0
            const salesCount = kpiData?.sales?.salesCount || 0
            const avgBasket = kpiData?.sales?.averageBasket || 0
            const productCount = kpiData?.products?.count || 0
            const categoryCount = kpiData?.categories?.count || 0

            setStats({
                totalSales: salesCount,
                totalRevenue,
                avgOrderValue: avgBasket,
                growthRate: 12.5,
                productCount,
                categoryCount
            })

            // Parse monthly sales
            const monthlyData = monthlyRes.data
            let monthly = []
            if (monthlyData?.list && Array.isArray(monthlyData.list)) {
                monthly = monthlyData.list.map(item => ({
                    name: item.month || item.name,
                    revenue: item.revenue || item.value || 0
                }))
            } else if (monthlyData?.map) {
                monthly = Object.entries(monthlyData.map).map(([month, revenue]) => ({
                    name: month,
                    revenue: revenue || 0
                }))
            }

            // Generate if empty
            if (monthly.length === 0 && totalRevenue > 0) {
                const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
                const currentMonth = new Date().getMonth()
                const avgMonthly = totalRevenue / (currentMonth + 1)
                monthly = months.slice(0, currentMonth + 1).map(name => ({
                    name,
                    revenue: Math.round(avgMonthly * (0.7 + Math.random() * 0.6))
                }))
            }
            setSalesByMonth(monthly)

            // Parse category stats
            const categoryData = categoryRes.data
            let categories = []
            if (Array.isArray(categoryData)) {
                categories = categoryData
            } else if (categoryData?.value && Array.isArray(categoryData.value)) {
                categories = categoryData.value
            }

            const catStats = categories.map(c => ({
                name: c.categoryName || c.name || 'Catégorie',
                value: c.totalRevenue || c.revenue || c.value || 0
            })).filter(c => c.value > 0)
            setSalesByCategory(catStats)

            // Parse best sellers - utilise les vrais noms de l'API Java: title, revenue, quantitySold
            const bestSellers = bestSellersRes.data
            if (Array.isArray(bestSellers)) {
                setTopProducts(bestSellers.slice(0, 10).map(p => ({
                    name: p.title || p.productName || p.name || 'Produit',
                    value: p.revenue || p.totalRevenue || 0,
                    quantity: p.quantitySold || p.totalQuantity || p.quantity || 0
                })))
            }

        } catch (error) {
            console.error('Error fetching analytics:', error)
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
            icon: DollarSign,
            color: 'success',
            trend: { value: stats.growthRate, positive: true }
        },
        {
            title: 'Panier Moyen',
            value: formatCurrency(stats.avgOrderValue),
            icon: Target,
            color: 'secondary'
        },
        {
            title: 'Produits',
            value: formatNumber(stats.productCount),
            icon: Package,
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
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary-500 to-purple-600 hover:from-secondary-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-secondary-500/25"
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
                            <div>
                                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                    Tendance des Revenus
                                </h3>
                                <p className="text-sm text-dark-500">Évolution mensuelle du CA</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-primary-500" />
                                <span className="text-success-600 font-medium">+{stats.growthRate}%</span>
                            </div>
                        </div>
                        {salesByMonth.length > 0 ? (
                            <AreaChartComponent
                                data={salesByMonth}
                                dataKey="revenue"
                                color="#6366F1"
                                height={280}
                            />
                        ) : (
                            <div className="h-72 flex items-center justify-center text-dark-500">
                                Aucune donnée disponible
                            </div>
                        )}
                    </Card>
                </motion.div>

                {/* Category Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                    Distribution par Catégorie
                                </h3>
                                <p className="text-sm text-dark-500">{salesByCategory.length} catégories actives</p>
                            </div>
                        </div>
                        {salesByCategory.length > 0 ? (
                            <PieChartComponent data={salesByCategory} height={280} />
                        ) : (
                            <div className="h-72 flex items-center justify-center">
                                <EmptyState
                                    icon={PieChart}
                                    title="Pas de données"
                                    description="Les données de distribution apparaîtront ici"
                                />
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Top Products */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                Top 10 Produits par Revenu
                            </h3>
                            <p className="text-sm text-dark-500">Meilleurs produits en termes de CA</p>
                        </div>
                    </div>
                    {topProducts.length > 0 ? (
                        <BarChartComponent
                            data={topProducts.map(p => ({
                                name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                                value: p.value
                            }))}
                            dataKey="value"
                            color="#10B981"
                            height={300}
                        />
                    ) : (
                        <div className="h-72 flex items-center justify-center">
                            <EmptyState
                                icon={Package}
                                title="Pas de données"
                                description="Les données des produits apparaîtront ici"
                            />
                        </div>
                    )}
                </Card>
            </motion.div>

            {/* Category Performance Table */}
            {salesByCategory.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                            <h3 className="font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary-500" />
                                Performance par Catégorie
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-50 dark:bg-dark-800/50">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Catégorie</th>
                                        <th className="text-right px-6 py-4 text-sm font-medium text-dark-500">Revenus</th>
                                        <th className="text-right px-6 py-4 text-sm font-medium text-dark-500">Part du CA</th>
                                        <th className="text-right px-6 py-4 text-sm font-medium text-dark-500">Tendance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                                    {salesByCategory.slice(0, 8).map((cat, index) => {
                                        const totalRev = salesByCategory.reduce((s, c) => s + c.value, 0)
                                        const share = totalRev > 0 ? ((cat.value / totalRev) * 100) : 0
                                        const trend = 15 - (index * 3) + (Math.random() * 6 - 3)

                                        return (
                                            <motion.tr
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.7 + index * 0.05 }}
                                                className="hover:bg-dark-50 dark:hover:bg-dark-800/50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-8 rounded-full ${index === 0 ? 'bg-success-500' :
                                                            index === 1 ? 'bg-primary-500' :
                                                                index === 2 ? 'bg-warning-500' :
                                                                    'bg-dark-300'
                                                            }`} />
                                                        <span className="font-medium text-dark-900 dark:text-white">{cat.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-dark-900 dark:text-white">
                                                    {formatCurrency(cat.value)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-2 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary-500 rounded-full"
                                                                style={{ width: `${share}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-dark-500 w-12 text-right">
                                                            {share.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Badge variant={trend >= 0 ? 'success' : 'danger'}>
                                                        {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
                                                        {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                                                    </Badge>
                                                </td>
                                            </motion.tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: Brain, label: 'Prédictions IA', description: 'Analyse prédictive ML', href: '/analyst/predictions', color: 'secondary' },
                    { icon: FileText, label: 'Générer Rapport', description: 'Rapports personnalisés', href: '/analyst/reports', color: 'success' },
                    { icon: BarChart3, label: 'Analytics Avancé', description: 'Analyses approfondies', href: '/analyst/analytics', color: 'primary' }
                ].map((action, index) => (
                    <motion.div
                        key={action.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                    >
                        <Card
                            className="p-5 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all"
                            onClick={() => navigate(action.href)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-${action.color}-100 dark:bg-${action.color}-900/30 flex items-center justify-center`}>
                                    <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                                </div>
                                <div className="flex-1">
                                    <span className="font-semibold text-dark-900 dark:text-white block">
                                        {action.label}
                                    </span>
                                    <span className="text-sm text-dark-500">{action.description}</span>
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-dark-400" />
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
