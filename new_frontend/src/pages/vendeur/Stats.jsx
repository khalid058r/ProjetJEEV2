import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    TrendingUp, Calendar, DollarSign, ShoppingCart, Package,
    Award, Target, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
    Filter, Download
} from 'lucide-react'
import { saleApi, userApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { Card, Loading, Badge, Button, EmptyState } from '../../components/ui'
import { AreaChartComponent, BarChartComponent, PieChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export default function VendeurStats() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month') // week, month, year
    const [stats, setStats] = useState({
        totalSales: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        totalProducts: 0
    })
    const [comparison, setComparison] = useState({
        salesChange: 0,
        revenueChange: 0
    })
    const [salesByDay, setSalesByDay] = useState([])
    const [salesByMonth, setSalesByMonth] = useState([])
    const [topProducts, setTopProducts] = useState([])
    const [ranking, setRanking] = useState({ position: 0, total: 0, topVendeurs: [] })

    useEffect(() => {
        fetchData()
    }, [period])

    const fetchData = async () => {
        try {
            setLoading(true)

            const [salesRes, usersRes] = await Promise.all([
                saleApi.getAll().catch(() => ({ data: [] })),
                userApi.getAll().catch(() => ({ data: [] }))
            ])

            const allSales = salesRes.data || []
            const allUsers = usersRes.data || []
            const mySales = allSales.filter(s => s.userId === user?.id)

            // Calculer la période
            const now = new Date()
            let startDate = new Date()
            let prevStartDate = new Date()
            let prevEndDate = new Date()

            if (period === 'week') {
                startDate.setDate(startDate.getDate() - 7)
                prevEndDate = new Date(startDate)
                prevStartDate.setDate(prevStartDate.getDate() - 14)
            } else if (period === 'month') {
                startDate.setMonth(startDate.getMonth() - 1)
                prevEndDate = new Date(startDate)
                prevStartDate.setMonth(prevStartDate.getMonth() - 1)
            } else {
                startDate.setFullYear(startDate.getFullYear() - 1)
                prevEndDate = new Date(startDate)
                prevStartDate.setFullYear(prevStartDate.getFullYear() - 1)
            }

            // Filtrer par période
            const periodSales = mySales.filter(s => new Date(s.saleDate) >= startDate)
            const prevPeriodSales = mySales.filter(s => {
                const d = new Date(s.saleDate)
                return d >= prevStartDate && d < prevEndDate
            })

            // Stats principales
            const totalRevenue = periodSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
            const prevRevenue = prevPeriodSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)

            // Comptage des produits vendus
            let totalProducts = 0
            periodSales.forEach(sale => {
                if (sale.lignes) {
                    totalProducts += sale.lignes.reduce((sum, l) => sum + (l.quantity || 1), 0)
                }
            })

            setStats({
                totalSales: periodSales.length,
                totalRevenue,
                avgOrderValue: periodSales.length > 0 ? totalRevenue / periodSales.length : 0,
                totalProducts
            })

            // Comparaison avec période précédente
            const salesChange = prevPeriodSales.length > 0
                ? ((periodSales.length - prevPeriodSales.length) / prevPeriodSales.length) * 100
                : 0
            const revenueChange = prevRevenue > 0
                ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
                : 0

            setComparison({ salesChange, revenueChange })

            // Ventes par jour (7 derniers jours)
            const dailyData = []
            for (let i = 6; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split('T')[0]
                const daySales = mySales.filter(s => s.saleDate?.startsWith(dateStr))
                dailyData.push({
                    name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
                    ventes: daySales.length,
                    revenue: daySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                })
            }
            setSalesByDay(dailyData)

            // Ventes par mois (6 derniers mois)
            const monthlyData = []
            for (let i = 5; i >= 0; i--) {
                const date = new Date()
                date.setMonth(date.getMonth() - i)
                const month = date.getMonth()
                const year = date.getFullYear()
                const monthSales = mySales.filter(s => {
                    const d = new Date(s.saleDate)
                    return d.getMonth() === month && d.getFullYear() === year
                })
                monthlyData.push({
                    name: date.toLocaleDateString('fr-FR', { month: 'short' }),
                    ventes: monthSales.length,
                    revenue: monthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                })
            }
            setSalesByMonth(monthlyData)

            // Top produits vendus
            const productMap = {}
            periodSales.forEach(sale => {
                if (sale.lignes) {
                    sale.lignes.forEach(ligne => {
                        const name = ligne.productTitle || 'Produit'
                        if (!productMap[name]) {
                            productMap[name] = { quantity: 0, revenue: 0 }
                        }
                        productMap[name].quantity += ligne.quantity || 1
                        productMap[name].revenue += (ligne.quantity || 1) * (ligne.unitPrice || 0)
                    })
                }
            })
            setTopProducts(
                Object.entries(productMap)
                    .map(([name, data]) => ({ name, ...data }))
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)
            )

            // Classement des vendeurs
            const vendeurs = allUsers.filter(u => u.role === 'VENDEUR')
            const thisMonth = now.getMonth()
            const thisYear = now.getFullYear()

            const vendeurStats = vendeurs.map(v => {
                const vSales = allSales.filter(s => s.userId === v.id)
                const vMonthSales = vSales.filter(s => {
                    const d = new Date(s.saleDate)
                    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
                })
                return {
                    id: v.id,
                    name: v.username,
                    sales: vMonthSales.length,
                    revenue: vMonthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                }
            }).sort((a, b) => b.revenue - a.revenue)

            const myPosition = vendeurStats.findIndex(v => v.id === user?.id) + 1
            setRanking({
                position: myPosition || vendeurStats.length,
                total: vendeurStats.length,
                topVendeurs: vendeurStats.slice(0, 5)
            })

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
            color: 'success',
            change: comparison.salesChange
        },
        {
            title: 'Chiffre d\'Affaires',
            value: formatCurrency(stats.totalRevenue),
            icon: DollarSign,
            color: 'primary',
            change: comparison.revenueChange
        },
        {
            title: 'Panier Moyen',
            value: formatCurrency(stats.avgOrderValue),
            icon: Target,
            color: 'secondary'
        },
        {
            title: 'Produits Vendus',
            value: formatNumber(stats.totalProducts),
            icon: Package,
            color: 'warning'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-primary-500" />
                        Mes Statistiques
                    </h1>
                    <p className="text-dark-500">Analysez vos performances de vente</p>
                </div>

                {/* Period Filter */}
                <div className="flex items-center gap-2 bg-dark-100 dark:bg-dark-800 rounded-xl p-1">
                    {[
                        { key: 'week', label: 'Semaine' },
                        { key: 'month', label: 'Mois' },
                        { key: 'year', label: 'Année' }
                    ].map(p => (
                        <button
                            key={p.key}
                            onClick={() => setPeriod(p.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p.key
                                    ? 'bg-white dark:bg-dark-700 text-primary-600 shadow-sm'
                                    : 'text-dark-500 hover:text-dark-700'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
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
                        <Card className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                                </div>
                                {stat.change !== undefined && (
                                    <div className={`flex items-center gap-1 text-sm font-medium ${stat.change >= 0 ? 'text-success-600' : 'text-danger-600'
                                        }`}>
                                        {stat.change >= 0 ? (
                                            <ArrowUpRight className="w-4 h-4" />
                                        ) : (
                                            <ArrowDownRight className="w-4 h-4" />
                                        )}
                                        {Math.abs(stat.change).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-dark-900 dark:text-white">{stat.value}</p>
                            <p className="text-sm text-dark-500 mt-1">{stat.title}</p>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Performance Journalière (7 jours)
                        </h3>
                        <AreaChartComponent
                            data={salesByDay}
                            dataKey="revenue"
                            color="#10B981"
                            height={250}
                        />
                    </Card>
                </motion.div>

                {/* Monthly Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Évolution Mensuelle (6 mois)
                        </h3>
                        <BarChartComponent
                            data={salesByMonth}
                            dataKey="revenue"
                            color="#6366F1"
                            height={250}
                        />
                    </Card>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Mes Produits Phares
                        </h3>
                        {topProducts.length > 0 ? (
                            <div className="space-y-3">
                                {topProducts.map((product, idx) => (
                                    <div
                                        key={product.name}
                                        className="flex items-center justify-between p-3 rounded-xl bg-dark-50 dark:bg-dark-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    idx === 1 ? 'bg-gray-100 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-dark-100 text-dark-600'
                                                }`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-dark-900 dark:text-white text-sm">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-dark-500">{product.quantity} vendus</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-success-600">
                                            {formatCurrency(product.revenue)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Package}
                                title="Aucun produit"
                                description="Vos produits phares apparaîtront ici"
                            />
                        )}
                    </Card>
                </motion.div>

                {/* Ranking */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                Classement des Vendeurs
                            </h3>
                            <Badge variant="primary">Ce mois</Badge>
                        </div>

                        {/* My Position */}
                        <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">{ranking.position}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-dark-900 dark:text-white">Votre position</p>
                                        <p className="text-sm text-dark-500">sur {ranking.total} vendeurs</p>
                                    </div>
                                </div>
                                <Award className="w-8 h-8 text-primary-500" />
                            </div>
                        </div>

                        {/* Top 5 */}
                        <div className="space-y-2">
                            {ranking.topVendeurs.map((v, idx) => (
                                <div
                                    key={v.id}
                                    className={`flex items-center justify-between p-3 rounded-xl ${v.id === user?.id
                                            ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                                            : 'bg-dark-50 dark:bg-dark-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                idx === 1 ? 'bg-gray-300 text-gray-700' :
                                                    idx === 2 ? 'bg-orange-400 text-orange-900' :
                                                        'bg-dark-200 text-dark-600'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <span className={`text-sm ${v.id === user?.id ? 'font-bold text-primary-700 dark:text-primary-300' : 'text-dark-700 dark:text-dark-300'
                                            }`}>
                                            {v.name} {v.id === user?.id && '(vous)'}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-dark-900 dark:text-white">
                                        {formatCurrency(v.revenue)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
