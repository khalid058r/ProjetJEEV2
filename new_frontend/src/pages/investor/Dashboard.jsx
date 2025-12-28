import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart,
    ArrowUpRight, Package, ShoppingCart, Eye
} from 'lucide-react'
import { saleApi, productApi, categoryApi } from '../../api'
import { StatCard, Card, Loading, EmptyState } from '../../components/ui'
import { AreaChartComponent, PieChartComponent, BarChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatCompactNumber } from '../../utils/formatters'

export default function InvestorDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalSales: 0,
        avgOrderValue: 0,
        productCount: 0
    })
    const [revenueData, setRevenueData] = useState([])
    const [categoryData, setCategoryData] = useState([])
    const [topPerformers, setTopPerformers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
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
                totalRevenue,
                totalSales: sales.length,
                avgOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
                productCount: products.length
            })

            // Revenue by month
            const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
            setRevenueData(months.map((name, i) => ({
                name,
                revenue: Math.floor(Math.random() * 80000) + 40000,
                profit: Math.floor(Math.random() * 30000) + 15000
            })))

            // Build product category map
            const productCategoryMap = {}
            products.forEach(p => {
                productCategoryMap[p.id] = p.categoryName || 'Autre'
            })

            // Revenue by category (from lignes)
            const catRevenue = {}
            sales.forEach(sale => {
                if (sale.lignes && Array.isArray(sale.lignes)) {
                    sale.lignes.forEach(ligne => {
                        const catName = productCategoryMap[ligne.productId] || 'Autre'
                        catRevenue[catName] = (catRevenue[catName] || 0) + (ligne.lineTotal || 0)
                    })
                }
            })
            setCategoryData(Object.entries(catRevenue).map(([name, value]) => ({ name, value })))

            // Top performers (from lignes)
            const productPerformance = {}
            sales.forEach(sale => {
                if (sale.lignes && Array.isArray(sale.lignes)) {
                    sale.lignes.forEach(ligne => {
                        const name = ligne.productTitle || 'Produit'
                        if (productPerformance[name]) {
                            productPerformance[name].revenue += ligne.lineTotal || 0
                            productPerformance[name].sales += 1
                        } else {
                            productPerformance[name] = {
                                name,
                                revenue: ligne.lineTotal || 0,
                                sales: 1,
                                margin: Math.floor(Math.random() * 30) + 15
                            }
                        }
                    })
                }
            })
            setTopPerformers(
                Object.values(productPerformance)
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)
            )

        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loading />

    const statCards = [
        {
            title: 'Chiffre d\'Affaires',
            value: formatCompactNumber(stats.totalRevenue) + ' MAD',
            icon: DollarSign,
            color: 'success',
            trend: { value: 12.5, positive: true }
        },
        {
            title: 'Marge Estimée',
            value: formatCompactNumber(stats.totalRevenue * 0.25) + ' MAD',
            icon: TrendingUp,
            color: 'primary',
            trend: { value: 8.3, positive: true }
        },
        {
            title: 'Transactions',
            value: formatNumber(stats.totalSales),
            icon: ShoppingCart,
            color: 'secondary',
            trend: { value: 5.2, positive: true }
        },
        {
            title: 'Panier Moyen',
            value: formatCurrency(stats.avgOrderValue),
            icon: BarChart3,
            color: 'warning'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Tableau de Bord Investisseur
                    </h1>
                    <p className="text-dark-500">Vue d'ensemble des performances financières</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm">
                        <option>Cette année</option>
                        <option>Dernier trimestre</option>
                        <option>Ce mois</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
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

            {/* Main Revenue Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="p-6 bg-gradient-to-br from-warning-500 to-orange-500 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-white/80">Retour sur Investissement Estimé</p>
                            <p className="text-4xl font-bold">+18.5%</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4" />
                            <span>+3.2% vs trimestre précédent</span>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                Évolution des Revenus
                            </h3>
                            <button
                                onClick={() => navigate('/investor/financial')}
                                className="text-sm text-warning-600 hover:underline flex items-center gap-1"
                            >
                                Voir détails
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                        <AreaChartComponent
                            data={revenueData.map(d => ({ name: d.name, value: d.revenue }))}
                            dataKey="value"
                            color="#F59E0B"
                            height={280}
                        />
                    </Card>
                </motion.div>

                {/* Category Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                Répartition par Catégorie
                            </h3>
                            <button
                                onClick={() => navigate('/investor/categories')}
                                className="text-sm text-warning-600 hover:underline flex items-center gap-1"
                            >
                                Analyser
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                        {categoryData.length > 0 ? (
                            <PieChartComponent data={categoryData} height={280} />
                        ) : (
                            <EmptyState
                                icon={PieChart}
                                title="Pas de données"
                                description="Les données apparaîtront avec les ventes"
                            />
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Top Performers */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <Card className="overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
                        <h3 className="font-semibold text-dark-900 dark:text-white">
                            Meilleurs Produits par Rentabilité
                        </h3>
                        <button
                            onClick={() => navigate('/investor/products')}
                            className="text-sm text-warning-600 hover:underline flex items-center gap-1"
                        >
                            Voir tous
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                    {topPerformers.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-dark-700">
                            {topPerformers.map((product, index) => (
                                <div key={index} className="p-4 flex items-center justify-between hover:bg-dark-50 dark:hover:bg-dark-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                                            <Package className="w-5 h-5 text-warning-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-dark-900 dark:text-white">{product.name}</p>
                                            <p className="text-sm text-dark-500">{product.sales} ventes</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-dark-900 dark:text-white">
                                            {formatCurrency(product.revenue)}
                                        </p>
                                        <p className="text-sm text-success-600">+{product.margin}% marge</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6">
                            <EmptyState
                                icon={Package}
                                title="Pas de données"
                            />
                        </div>
                    )}
                </Card>
            </motion.div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: BarChart3, label: 'Performance Détaillée', href: '/investor/performance', color: 'warning' },
                    { icon: DollarSign, label: 'Analyse Financière', href: '/investor/financial', color: 'success' },
                    { icon: PieChart, label: 'Portfolio', href: '/investor/portfolio', color: 'primary' }
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
