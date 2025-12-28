import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    TrendingUp, TrendingDown, Target, Award, BarChart3,
    ArrowUpRight, Clock, Calendar
} from 'lucide-react'
import { saleApi, productApi, categoryApi } from '../../api'
import { Card, Loading, Badge } from '../../components/ui'
import { AreaChartComponent, BarChartComponent, LineChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters'

export default function Performance() {
    const [performanceData, setPerformanceData] = useState({
        kpis: [],
        trends: [],
        categories: [],
        sellers: []
    })
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month')

    useEffect(() => {
        fetchPerformanceData()
    }, [period])

    const fetchPerformanceData = async () => {
        try {
            setLoading(true)
            const [salesRes, productsRes, categoriesRes] = await Promise.all([
                saleApi.getAll(),
                productApi.getAll(),
                categoryApi.getAll()
            ])

            const sales = salesRes.data || []
            const products = productsRes.data || []
            const categories = categoriesRes.data || []

            // KPIs
            const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
            const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0

            const kpis = [
                {
                    name: 'Taux de Conversion',
                    value: 68,
                    target: 75,
                    unit: '%',
                    trend: 5.2,
                    positive: true
                },
                {
                    name: 'Panier Moyen',
                    value: avgOrderValue,
                    target: avgOrderValue * 1.2,
                    unit: 'MAD',
                    trend: 8.3,
                    positive: true
                },
                {
                    name: 'Rotation Stock',
                    value: 4.2,
                    target: 5,
                    unit: 'x',
                    trend: -2.1,
                    positive: false
                },
                {
                    name: 'Score Satisfaction',
                    value: 4.6,
                    target: 4.8,
                    unit: '/5',
                    trend: 0.3,
                    positive: true
                }
            ]

            // Weekly trends
            const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
            const trends = weeks.map((name) => ({
                name,
                ventes: Math.floor(Math.random() * 100) + 50,
                objectif: 80,
                revenue: Math.floor(Math.random() * 50000) + 30000
            }))

            // Category performance (using lignes data and product mapping)
            const productCategoryMap = {}
            products.forEach(p => {
                productCategoryMap[p.id] = { catId: p.categoryId, catName: p.categoryName }
            })

            const catPerformance = categories.slice(0, 6).map(cat => {
                let revenue = 0
                let salesCount = 0
                sales.forEach(sale => {
                    if (sale.lignes && Array.isArray(sale.lignes)) {
                        sale.lignes.forEach(ligne => {
                            const prodCat = productCategoryMap[ligne.productId]
                            if (prodCat && prodCat.catId === cat.id) {
                                revenue += ligne.lineTotal || 0
                                salesCount++
                            }
                        })
                    }
                })
                return {
                    name: cat.name,
                    revenue,
                    sales: salesCount,
                    growth: Math.floor(Math.random() * 30) - 5
                }
            })

            // Top sellers (mock)
            const sellers = [
                { name: 'Ahmed Benali', sales: 156, revenue: 125000, target: 120000 },
                { name: 'Sara Tazi', sales: 142, revenue: 115000, target: 120000 },
                { name: 'Mohamed Alami', sales: 128, revenue: 98000, target: 100000 },
                { name: 'Fatima Zahra', sales: 115, revenue: 92000, target: 95000 },
                { name: 'Youssef Idrissi', sales: 98, revenue: 78000, target: 90000 }
            ]

            setPerformanceData({
                kpis,
                trends,
                categories: catPerformance,
                sellers
            })
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Performance
                    </h1>
                    <p className="text-dark-500">Suivi des indicateurs clés de performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm"
                    >
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                        <option value="quarter">Ce trimestre</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {performanceData.kpis.map((kpi, index) => {
                    const progress = (kpi.value / kpi.target) * 100
                    const isOnTrack = progress >= 90

                    return (
                        <motion.div
                            key={kpi.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-dark-500">{kpi.name}</span>
                                    <Badge variant={kpi.positive ? 'success' : 'danger'}>
                                        {kpi.positive ? '+' : ''}{kpi.trend}%
                                    </Badge>
                                </div>
                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className="text-2xl font-bold text-dark-900 dark:text-white">
                                        {typeof kpi.value === 'number' && kpi.unit === 'MAD'
                                            ? formatCurrency(kpi.value)
                                            : kpi.value}
                                    </span>
                                    {kpi.unit !== 'MAD' && (
                                        <span className="text-sm text-dark-500">{kpi.unit}</span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs text-dark-500">
                                        <span>Objectif: {typeof kpi.target === 'number' && kpi.unit === 'MAD'
                                            ? formatCurrency(kpi.target)
                                            : kpi.target}{kpi.unit !== 'MAD' ? kpi.unit : ''}</span>
                                        <span className={isOnTrack ? 'text-success-600' : 'text-warning-600'}>
                                            {progress.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${isOnTrack ? 'bg-success-500' : 'bg-warning-500'
                                                }`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            {/* Weekly Performance */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                            Performance Hebdomadaire
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-primary-500" />
                                <span className="text-dark-500">Ventes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded border-2 border-warning-500" />
                                <span className="text-dark-500">Objectif</span>
                            </div>
                        </div>
                    </div>
                    <BarChartComponent
                        data={performanceData.trends.map(t => ({ name: t.name, value: t.ventes }))}
                        dataKey="value"
                        color="#6366F1"
                        height={280}
                    />
                </Card>
            </motion.div>

            {/* Category & Seller Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                            <h3 className="font-semibold text-dark-900 dark:text-white">
                                Performance par Catégorie
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-dark-700">
                            {performanceData.categories.map((cat, index) => (
                                <div key={index} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-dark-900 dark:text-white">{cat.name}</p>
                                        <p className="text-sm text-dark-500">{cat.sales} ventes</p>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div>
                                            <p className="font-semibold text-dark-900 dark:text-white">
                                                {formatCurrency(cat.revenue)}
                                            </p>
                                            <div className={`flex items-center justify-end text-sm ${cat.growth >= 0 ? 'text-success-600' : 'text-danger-600'
                                                }`}>
                                                {cat.growth >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                                {cat.growth >= 0 ? '+' : ''}{cat.growth}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>

                {/* Top Sellers */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                            <h3 className="font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                                <Award className="w-5 h-5 text-warning-500" />
                                Top Vendeurs
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-dark-700">
                            {performanceData.sellers.map((seller, index) => {
                                const targetAchieved = (seller.revenue / seller.target) * 100
                                return (
                                    <div key={index} className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-warning-100 text-warning-700' :
                                                    index === 1 ? 'bg-dark-200 text-dark-600' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-dark-100 text-dark-500'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-dark-900 dark:text-white">{seller.name}</p>
                                                    <p className="text-xs text-dark-500">{seller.sales} ventes</p>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-dark-900 dark:text-white">
                                                {formatCurrency(seller.revenue)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${targetAchieved >= 100 ? 'bg-success-500' : 'bg-primary-500'
                                                        }`}
                                                    style={{ width: `${Math.min(targetAchieved, 100)}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-medium ${targetAchieved >= 100 ? 'text-success-600' : 'text-dark-500'
                                                }`}>
                                                {targetAchieved.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
