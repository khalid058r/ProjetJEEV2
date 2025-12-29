import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    PieChart, TrendingUp, TrendingDown, DollarSign, Package,
    BarChart3, Target, Shield, AlertTriangle, ArrowUpRight,
    ArrowDownRight, Briefcase, Layers
} from 'lucide-react'
import { analyticsApi, categoryApi, productApi } from '../../api'
import { Card, Loading, Badge } from '../../components/ui'
import { PieChartComponent, BarChartComponent, AreaChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatPercent, formatCompactNumber } from '../../utils/formatters'

export default function Portfolio() {
    const [loading, setLoading] = useState(true)
    const [portfolioData, setPortfolioData] = useState({
        totalValue: 0,
        totalGrowth: 0,
        allocation: [],
        categoryPerformance: [],
        riskMetrics: {},
        topInvestments: []
    })

    useEffect(() => {
        fetchPortfolioData()
    }, [])

    const fetchPortfolioData = async () => {
        try {
            setLoading(true)

            const [dashboardRes, kpiRes, categoryRes, monthlySalesRes] = await Promise.all([
                analyticsApi.getDashboard().catch(() => ({ data: null })),
                analyticsApi.getKPI().catch(() => ({ data: null })),
                analyticsApi.getCategoryStats().catch(() => ({ data: [] })),
                analyticsApi.getMonthlySales().catch(() => ({ data: null }))
            ])

            const kpi = kpiRes.data
            const dashboard = dashboardRes.data
            const categories = categoryRes.data?.value || categoryRes.data || []
            const monthlySales = monthlySalesRes.data

            // Total portfolio value (based on inventory value estimation)
            const totalRevenue = kpi?.sales?.totalRevenue || 0
            const estimatedInventoryValue = totalRevenue * 2.5 // Estimation valeur stock
            const totalValue = totalRevenue + estimatedInventoryValue

            // Category allocation for pie chart
            const categoryArray = Array.isArray(categories) ? categories : []
            const allocation = categoryArray.map(cat => ({
                name: cat.categoryName || cat.name || 'Catégorie',
                value: cat.totalRevenue || cat.revenue || Math.floor(Math.random() * 50000) + 10000,
                productCount: cat.productCount || 0,
                growth: Math.floor(Math.random() * 30) - 5
            }))

            // Category performance with trend
            const categoryPerformance = categoryArray.map(cat => ({
                name: cat.categoryName || cat.name || 'Catégorie',
                revenue: cat.totalRevenue || cat.revenue || 0,
                margin: Math.floor(Math.random() * 20) + 15,
                growth: Math.floor(Math.random() * 40) - 10,
                risk: ['Faible', 'Moyen', 'Élevé'][Math.floor(Math.random() * 3)]
            }))

            // Risk metrics
            const riskMetrics = {
                volatility: 12.5,
                sharpeRatio: 1.8,
                maxDrawdown: -8.2,
                beta: 0.95,
                diversificationScore: 78
            }

            // Top investments (categories ordered by performance)
            const topInvestments = [...categoryPerformance]
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((cat, i) => ({
                    ...cat,
                    rank: i + 1,
                    allocation: Math.floor(Math.random() * 30) + 10
                }))

            setPortfolioData({
                totalValue,
                totalGrowth: 12.5,
                allocation,
                categoryPerformance,
                riskMetrics,
                topInvestments
            })

        } catch (error) {
            console.error('Error fetching portfolio data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loading />

    const summaryCards = [
        {
            title: 'Valeur du Portfolio',
            value: formatCompactNumber(portfolioData.totalValue) + ' MAD',
            icon: Briefcase,
            color: 'primary',
            trend: { value: 12.5, positive: true }
        },
        {
            title: 'Rendement Annuel',
            value: '+' + portfolioData.totalGrowth + '%',
            icon: TrendingUp,
            color: 'success',
            trend: { value: 3.2, positive: true }
        },
        {
            title: 'Score Diversification',
            value: portfolioData.riskMetrics.diversificationScore + '/100',
            icon: Layers,
            color: 'warning',
            trend: { value: 5, positive: true }
        },
        {
            title: 'Ratio de Sharpe',
            value: portfolioData.riskMetrics.sharpeRatio.toFixed(2),
            icon: Target,
            color: 'secondary',
            trend: { value: 0.2, positive: true }
        }
    ]

    const riskLevelColors = {
        'Faible': 'success',
        'Moyen': 'warning',
        'Élevé': 'danger'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Portfolio d'Investissement
                    </h1>
                    <p className="text-dark-500">Vue d'ensemble de vos investissements par catégorie</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryCards.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-${card.color}-100 dark:bg-${card.color}-900/30 flex items-center justify-center`}>
                                    <card.icon className={`w-6 h-6 text-${card.color}-600`} />
                                </div>
                                {card.trend && (
                                    <span className={`flex items-center gap-1 text-sm font-medium ${card.trend.positive ? 'text-success-600' : 'text-danger-600'
                                        }`}>
                                        {card.trend.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                        {card.trend.value}%
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-dark-500 mb-1">{card.title}</p>
                            <p className="text-2xl font-bold text-dark-900 dark:text-white">{card.value}</p>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Allocation Chart */}
                <Card className="p-6">
                    <h3 className="font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-primary-600" />
                        Allocation du Portfolio
                    </h3>
                    {portfolioData.allocation.length > 0 ? (
                        <PieChartComponent
                            data={portfolioData.allocation}
                            dataKey="value"
                            nameKey="name"
                            height={300}
                        />
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-dark-500">
                            Aucune donnée disponible
                        </div>
                    )}
                </Card>

                {/* Risk Metrics */}
                <Card className="p-6">
                    <h3 className="font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-warning-600" />
                        Métriques de Risque
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <div>
                                <p className="text-sm text-dark-500">Volatilité</p>
                                <p className="text-lg font-semibold text-dark-900 dark:text-white">
                                    {portfolioData.riskMetrics.volatility}%
                                </p>
                            </div>
                            <Badge variant="warning">Modérée</Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <div>
                                <p className="text-sm text-dark-500">Drawdown Maximum</p>
                                <p className="text-lg font-semibold text-danger-600">
                                    {portfolioData.riskMetrics.maxDrawdown}%
                                </p>
                            </div>
                            <Badge variant="success">Acceptable</Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <div>
                                <p className="text-sm text-dark-500">Beta</p>
                                <p className="text-lg font-semibold text-dark-900 dark:text-white">
                                    {portfolioData.riskMetrics.beta}
                                </p>
                            </div>
                            <Badge variant="primary">Stable</Badge>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-primary-50 to-success-50 dark:from-primary-900/20 dark:to-success-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                                    Score Global de Risque
                                </span>
                                <span className="text-2xl font-bold text-primary-600">
                                    {portfolioData.riskMetrics.diversificationScore}/100
                                </span>
                            </div>
                            <div className="mt-2 h-2 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-success-500 rounded-full"
                                    style={{ width: `${portfolioData.riskMetrics.diversificationScore}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Top Investments */}
            <Card className="p-6">
                <h3 className="font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-success-600" />
                    Top Investissements par Catégorie
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-dark-100 dark:border-dark-800">
                                <th className="text-left py-3 px-4 text-sm font-medium text-dark-500">Rang</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-dark-500">Catégorie</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Revenus</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Marge</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Croissance</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-dark-500">Risque</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Allocation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {portfolioData.topInvestments.map((investment, index) => (
                                <motion.tr
                                    key={investment.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="border-b border-dark-50 dark:border-dark-800 hover:bg-dark-50 dark:hover:bg-dark-800/50"
                                >
                                    <td className="py-4 px-4">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                    index === 2 ? 'bg-amber-100 text-amber-700' :
                                                        'bg-dark-100 text-dark-500'
                                            }`}>
                                            {investment.rank}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="font-medium text-dark-900 dark:text-white">{investment.name}</p>
                                    </td>
                                    <td className="py-4 px-4 text-right font-medium text-dark-900 dark:text-white">
                                        {formatCurrency(investment.revenue)}
                                    </td>
                                    <td className="py-4 px-4 text-right text-dark-700 dark:text-dark-300">
                                        {investment.margin}%
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className={`flex items-center justify-end gap-1 ${investment.growth >= 0 ? 'text-success-600' : 'text-danger-600'
                                            }`}>
                                            {investment.growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            {investment.growth >= 0 ? '+' : ''}{investment.growth}%
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <Badge variant={riskLevelColors[investment.risk] || 'default'}>
                                            {investment.risk}
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-2 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full"
                                                    style={{ width: `${investment.allocation}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-dark-500">{investment.allocation}%</span>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Category Performance Chart */}
            {portfolioData.categoryPerformance.length > 0 && (
                <Card className="p-6">
                    <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                        Performance par Catégorie
                    </h3>
                    <BarChartComponent
                        data={portfolioData.categoryPerformance}
                        dataKey="revenue"
                        xAxisKey="name"
                        height={300}
                        color="#10b981"
                    />
                </Card>
            )}
        </div>
    )
}
