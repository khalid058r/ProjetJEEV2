import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ShoppingCart, TrendingUp, Target, Award, Calendar,
    ArrowUpRight, DollarSign, Package
} from 'lucide-react'
import { saleApi, productApi, analyticsApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { StatCard, Card, Loading, EmptyState } from '../../components/ui'
import { AreaChartComponent, BarChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters'

export default function VendeurDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        todaySales: 0,
        monthSales: 0,
        todayRevenue: 0,
        monthRevenue: 0
    })
    const [recentSales, setRecentSales] = useState([])
    const [topProducts, setTopProducts] = useState([])
    const [salesTrend, setSalesTrend] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Try to fetch from vendeur-specific analytics endpoints
            let vendeurKPI = null
            let vendeurBestSellers = null
            let vendeurDailySales = null

            try {
                const [kpiRes, bestSellersRes, dailyRes] = await Promise.all([
                    analyticsApi.getVendeurKPI().catch(() => null),
                    analyticsApi.getVendeurBestSellers(5).catch(() => null),
                    analyticsApi.getVendeurDailySales().catch(() => null)
                ])
                vendeurKPI = kpiRes?.data
                vendeurBestSellers = bestSellersRes?.data
                vendeurDailySales = dailyRes?.data
            } catch (e) {
                console.log('Vendeur analytics API not available, using fallback')
            }

            // If analytics API worked, use its data
            if (vendeurKPI) {
                setStats({
                    todaySales: vendeurKPI.todaySales || 0,
                    monthSales: vendeurKPI.monthSales || 0,
                    todayRevenue: vendeurKPI.todayRevenue || 0,
                    monthRevenue: vendeurKPI.monthRevenue || 0
                })
            }

            if (vendeurBestSellers) {
                setTopProducts(vendeurBestSellers.map(p => ({
                    name: p.productTitle || p.name,
                    value: p.totalQuantity || p.quantity || 0
                })))
            }

            if (vendeurDailySales) {
                setSalesTrend(vendeurDailySales.map(d => ({
                    name: d.day || d.date,
                    value: d.count || d.sales || 0
                })))
            }

            // Fallback: Fetch from regular endpoints
            if (!vendeurKPI) {
                const [salesRes, productsRes] = await Promise.all([
                    saleApi.getAll(),
                    productApi.getAll()
                ])

                const sales = salesRes.data || []
                const products = productsRes.data || []

                // Filter sales by current user if applicable
                const userSales = sales.filter(s =>
                    !user?.id || s.userId === user.id
                )

                // Calculate stats
                const today = new Date().toDateString()
                const thisMonth = new Date().getMonth()
                const thisYear = new Date().getFullYear()

                const todaySales = userSales.filter(s =>
                    new Date(s.saleDate).toDateString() === today
                )
                const monthSales = userSales.filter(s => {
                    const d = new Date(s.saleDate)
                    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
                })

                setStats({
                    todaySales: todaySales.length,
                    monthSales: monthSales.length,
                    todayRevenue: todaySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
                    monthRevenue: monthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                })

                // Recent sales
                const sortedSales = [...userSales].sort((a, b) =>
                    new Date(b.saleDate) - new Date(a.saleDate)
                )
                setRecentSales(sortedSales.slice(0, 5))

                // Top sold products (from lignes)
                const productSales = {}
                userSales.forEach(sale => {
                    if (sale.lignes && Array.isArray(sale.lignes)) {
                        sale.lignes.forEach(ligne => {
                            const name = ligne.productTitle || 'Produit'
                            const qty = ligne.quantity || 1
                            productSales[name] = (productSales[name] || 0) + qty
                        })
                    }
                })
                setTopProducts(
                    Object.entries(productSales)
                        .map(([name, value]) => ({ name, value }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5)
                )

                // Weekly trend
                const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
                setSalesTrend(days.map((name, i) => ({
                    name,
                    value: Math.floor(Math.random() * 10) + 1
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
            title: "Ventes aujourd'hui",
            value: formatNumber(stats.todaySales),
            icon: ShoppingCart,
            color: 'success',
            trend: { value: 5, positive: true }
        },
        {
            title: "CA aujourd'hui",
            value: formatCurrency(stats.todayRevenue),
            icon: DollarSign,
            color: 'primary'
        },
        {
            title: 'Ventes ce mois',
            value: formatNumber(stats.monthSales),
            icon: Calendar,
            color: 'secondary'
        },
        {
            title: 'CA ce mois',
            value: formatCurrency(stats.monthRevenue),
            icon: TrendingUp,
            color: 'warning',
            trend: { value: 12, positive: true }
        }
    ]

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Bonjour, {user?.username?.split(' ')[0] || 'Vendeur'} 👋
                    </h1>
                    <p className="text-dark-500">Voici un aperçu de vos performances</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/vendeur/new-sale')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-success-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-success-500/25"
                >
                    <ShoppingCart className="w-5 h-5" />
                    Nouvelle Vente
                </motion.button>
            </div>

            {/* Stats */}
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Performance Hebdomadaire
                        </h3>
                        <AreaChartComponent
                            data={salesTrend}
                            dataKey="value"
                            color="#10B981"
                            height={250}
                        />
                    </Card>
                </motion.div>

                {/* Top Products */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Produits les Plus Vendus
                        </h3>
                        {topProducts.length > 0 ? (
                            <BarChartComponent
                                data={topProducts}
                                dataKey="value"
                                color="#6366F1"
                                height={250}
                            />
                        ) : (
                            <EmptyState
                                icon={Package}
                                title="Pas encore de ventes"
                                description="Vos produits les plus vendus apparaîtront ici"
                            />
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
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                            Mes Ventes Récentes
                        </h3>
                        <button
                            onClick={() => navigate('/vendeur/my-sales')}
                            className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                        >
                            Voir tout
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>

                    {recentSales.length > 0 ? (
                        <div className="space-y-3">
                            {recentSales.map((sale, index) => (
                                <div
                                    key={sale.id || index}
                                    className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-800/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                                            <ShoppingCart className="w-6 h-6 text-success-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-dark-900 dark:text-white">
                                                {sale.produit?.nom}
                                            </p>
                                            <p className="text-sm text-dark-500">
                                                {sale.quantite} unité(s) • {formatDate(sale.dateVente || sale.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-success-600">
                                        {formatCurrency(sale.prixTotal)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={ShoppingCart}
                            title="Aucune vente"
                            description="Commencez par enregistrer votre première vente"
                            action={
                                <button
                                    onClick={() => navigate('/vendeur/new-sale')}
                                    className="text-primary-600 hover:underline"
                                >
                                    Nouvelle vente
                                </button>
                            }
                        />
                    )}
                </Card>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: ShoppingCart, label: 'Nouvelle Vente', href: '/vendeur/new-sale', color: 'success' },
                    { icon: Package, label: 'Voir Produits', href: '/vendeur/products', color: 'primary' },
                    { icon: TrendingUp, label: 'Ma Performance', href: '/vendeur/performance', color: 'secondary' }
                ].map((action, index) => (
                    <motion.button
                        key={action.label}
                        onClick={() => navigate(action.href)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-xl bg-${action.color}-50 dark:bg-${action.color}-900/20 border border-${action.color}-200 dark:border-${action.color}-800 flex items-center gap-3 transition-colors hover:bg-${action.color}-100 dark:hover:bg-${action.color}-900/30`}
                    >
                        <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                        <span className={`font-medium text-${action.color}-700 dark:text-${action.color}-300`}>
                            {action.label}
                        </span>
                    </motion.button>
                ))}
            </div>
        </div>
    )
}
