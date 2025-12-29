import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ShoppingCart, TrendingUp, Target, Award, Calendar,
    ArrowUpRight, DollarSign, Package, Crown, Medal, Trophy,
    Zap, Clock, ChevronRight, Star, Users
} from 'lucide-react'
import { saleApi, productApi, analyticsApi, userApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { StatCard, Card, Loading, EmptyState, Badge } from '../../components/ui'
import { AreaChartComponent, BarChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters'

export default function VendeurDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        todaySales: 0,
        monthSales: 0,
        todayRevenue: 0,
        monthRevenue: 0,
        weekSales: 0,
        weekRevenue: 0
    })
    const [recentSales, setRecentSales] = useState([])
    const [topProducts, setTopProducts] = useState([])
    const [salesTrend, setSalesTrend] = useState([])
    const [ranking, setRanking] = useState({ position: 0, total: 0 })
    const [objectives, setObjectives] = useState({
        salesTarget: 50,
        revenueTarget: 50000
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Charger toutes les données nécessaires
            const [salesRes, usersRes] = await Promise.all([
                saleApi.getAll().catch(() => ({ data: [] })),
                userApi.getAll().catch(() => ({ data: [] }))
            ])

            const allSales = salesRes.data || []
            const allUsers = usersRes.data || []

            // Filtrer les ventes de l'utilisateur courant
            const mySales = allSales.filter(s => s.userId === user?.id)

            // Calculer les stats
            const today = new Date()
            const todayStr = today.toISOString().split('T')[0]
            const thisMonth = today.getMonth()
            const thisYear = today.getFullYear()

            // Stats d'aujourd'hui
            const todaySales = mySales.filter(s => s.saleDate?.startsWith(todayStr))

            // Stats de la semaine
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            const weekSales = mySales.filter(s => new Date(s.saleDate) >= weekAgo)

            // Stats du mois
            const monthSales = mySales.filter(s => {
                const d = new Date(s.saleDate)
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear
            })

            setStats({
                todaySales: todaySales.length,
                todayRevenue: todaySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
                weekSales: weekSales.length,
                weekRevenue: weekSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
                monthSales: monthSales.length,
                monthRevenue: monthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
            })

            // Ventes récentes
            const sortedSales = [...mySales].sort((a, b) =>
                new Date(b.saleDate) - new Date(a.saleDate)
            )
            setRecentSales(sortedSales.slice(0, 5))

            // Produits les plus vendus
            const productSales = {}
            mySales.forEach(sale => {
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

            // Tendance des 7 derniers jours
            const days = []
            for (let i = 6; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split('T')[0]
                const daySales = mySales.filter(s => s.saleDate?.startsWith(dateStr))
                days.push({
                    name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
                    value: daySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                })
            }
            setSalesTrend(days)

            // Calculer le classement parmi les vendeurs
            const vendeurs = allUsers.filter(u => u.role === 'VENDEUR')
            const vendeurStats = vendeurs.map(v => {
                const vSales = allSales.filter(s => s.userId === v.id)
                const vMonthSales = vSales.filter(s => {
                    const d = new Date(s.saleDate)
                    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
                })
                return {
                    id: v.id,
                    name: v.username,
                    revenue: vMonthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                }
            }).sort((a, b) => b.revenue - a.revenue)

            const myPosition = vendeurStats.findIndex(v => v.id === user?.id) + 1
            setRanking({
                position: myPosition || vendeurStats.length,
                total: vendeurStats.length
            })

        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loading />

    // Calcul des pourcentages pour les objectifs
    const salesProgress = Math.min((stats.monthSales / objectives.salesTarget) * 100, 100)
    const revenueProgress = Math.min((stats.monthRevenue / objectives.revenueTarget) * 100, 100)

    return (
        <div className="space-y-6">
            {/* Header avec bienvenue et classement */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Bonjour, {user?.username?.split(' ')[0] || 'Vendeur'} 👋
                    </h1>
                    <p className="text-dark-500">Voici un aperçu de vos performances</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Badge de classement */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-xl border border-yellow-200 dark:border-yellow-800"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                            {ranking.position === 1 ? (
                                <Crown className="w-5 h-5 text-white" />
                            ) : ranking.position === 2 ? (
                                <Medal className="w-5 h-5 text-white" />
                            ) : ranking.position === 3 ? (
                                <Award className="w-5 h-5 text-white" />
                            ) : (
                                <span className="text-white font-bold">{ranking.position}</span>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-amber-700 dark:text-amber-400">Classement</p>
                            <p className="font-bold text-amber-900 dark:text-amber-300">
                                {ranking.position}/{ranking.total} vendeurs
                            </p>
                        </div>
                    </motion.div>

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
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        title: "Ventes aujourd'hui",
                        value: formatNumber(stats.todaySales),
                        icon: ShoppingCart,
                        color: 'success',
                        subValue: formatCurrency(stats.todayRevenue)
                    },
                    {
                        title: 'Ventes cette semaine',
                        value: formatNumber(stats.weekSales),
                        icon: Calendar,
                        color: 'primary',
                        subValue: formatCurrency(stats.weekRevenue)
                    },
                    {
                        title: 'Ventes ce mois',
                        value: formatNumber(stats.monthSales),
                        icon: TrendingUp,
                        color: 'secondary',
                        subValue: formatCurrency(stats.monthRevenue)
                    },
                    {
                        title: 'CA du mois',
                        value: formatCurrency(stats.monthRevenue),
                        icon: DollarSign,
                        color: 'warning',
                        trend: { value: 12, positive: true }
                    }
                ].map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center`}>
                                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                                </div>
                                {stat.trend && (
                                    <Badge variant="success" className="text-xs">
                                        +{stat.trend.value}%
                                    </Badge>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-dark-900 dark:text-white">{stat.value}</p>
                            <p className="text-sm text-dark-500">{stat.title}</p>
                            {stat.subValue && (
                                <p className="text-xs text-success-600 mt-1">{stat.subValue}</p>
                            )}
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Objectifs du mois */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-1"
                >
                    <Card className="p-6 h-full">
                        <div className="flex items-center gap-2 mb-6">
                            <Target className="w-5 h-5 text-primary-500" />
                            <h3 className="font-semibold text-dark-900 dark:text-white">Objectifs du mois</h3>
                        </div>

                        <div className="space-y-6">
                            {/* Objectif Ventes */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-dark-600 dark:text-dark-400">Nombre de ventes</span>
                                    <span className="text-sm font-medium text-dark-900 dark:text-white">
                                        {stats.monthSales}/{objectives.salesTarget}
                                    </span>
                                </div>
                                <div className="h-3 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${salesProgress}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-gradient-to-r from-success-500 to-emerald-500 rounded-full"
                                    />
                                </div>
                                <p className="text-xs text-dark-500 mt-1">{Math.round(salesProgress)}% atteint</p>
                            </div>

                            {/* Objectif CA */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-dark-600 dark:text-dark-400">Chiffre d'affaires</span>
                                    <span className="text-sm font-medium text-dark-900 dark:text-white">
                                        {formatCurrency(stats.monthRevenue)} / {formatCurrency(objectives.revenueTarget)}
                                    </span>
                                </div>
                                <div className="h-3 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${revenueProgress}%` }}
                                        transition={{ duration: 1, delay: 0.6 }}
                                        className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                                    />
                                </div>
                                <p className="text-xs text-dark-500 mt-1">{Math.round(revenueProgress)}% atteint</p>
                            </div>
                        </div>

                        {/* Score global */}
                        <div className="mt-6 pt-4 border-t border-dark-100 dark:border-dark-700">
                            <div className="flex items-center justify-between">
                                <span className="text-dark-500">Performance globale</span>
                                <span className="flex items-center gap-1 text-success-600 font-medium">
                                    <Zap className="w-4 h-4" />
                                    {Math.round((salesProgress + revenueProgress) / 2)}%
                                </span>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Weekly Performance Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2"
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Performance des 7 derniers jours
                        </h3>
                        <AreaChartComponent
                            data={salesTrend}
                            dataKey="value"
                            color="#10B981"
                            height={250}
                        />
                    </Card>
                </motion.div>
            </div>

            {/* Top Products & Recent Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Mes Produits les Plus Vendus
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

                {/* Recent Sales */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
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
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {recentSales.length > 0 ? (
                            <div className="space-y-3">
                                {recentSales.map((sale, index) => (
                                    <div
                                        key={sale.id || index}
                                        className="flex items-center justify-between p-3 rounded-xl bg-dark-50 dark:bg-dark-800/50 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
                                        onClick={() => navigate('/vendeur/my-sales')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                                                <ShoppingCart className="w-5 h-5 text-success-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-dark-900 dark:text-white text-sm">
                                                    Vente #{sale.id}
                                                </p>
                                                <p className="text-xs text-dark-500">
                                                    {sale.lignes?.length || 0} article(s) • {formatDate(sale.saleDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-success-600">
                                            {formatCurrency(sale.totalAmount)}
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
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { icon: ShoppingCart, label: 'Nouvelle Vente', href: '/vendeur/new-sale', color: 'success', desc: 'Enregistrer une vente' },
                        { icon: Clock, label: 'Mes Ventes', href: '/vendeur/my-sales', color: 'primary', desc: 'Historique des ventes' },
                        { icon: TrendingUp, label: 'Statistiques', href: '/vendeur/stats', color: 'secondary', desc: 'Voir mes performances' }
                    ].map((action, index) => (
                        <motion.button
                            key={action.label}
                            onClick={() => navigate(action.href)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl bg-${action.color}-50 dark:bg-${action.color}-900/20 border border-${action.color}-200 dark:border-${action.color}-800 flex items-center gap-4 transition-all hover:shadow-lg`}
                        >
                            <div className={`w-12 h-12 rounded-xl bg-${action.color}-100 dark:bg-${action.color}-900/30 flex items-center justify-center`}>
                                <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                            </div>
                            <div className="text-left">
                                <p className={`font-semibold text-${action.color}-700 dark:text-${action.color}-300`}>
                                    {action.label}
                                </p>
                                <p className="text-xs text-dark-500">{action.desc}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
