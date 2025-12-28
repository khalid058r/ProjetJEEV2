import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    DollarSign, TrendingUp, TrendingDown, BarChart3,
    ArrowUpRight, ArrowDownRight, Calendar, Download
} from 'lucide-react'
import { saleApi, productApi, categoryApi } from '../../api'
import { Card, Button, Loading, EmptyState, Badge } from '../../components/ui'
import { AreaChartComponent, BarChartComponent, LineChartComponent, MultiBarChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatCompactNumber, formatPercent } from '../../utils/formatters'
import { jsPDF } from 'jspdf'
import toast from 'react-hot-toast'

export default function Financial() {
    const [financialData, setFinancialData] = useState({
        revenue: [],
        profit: [],
        expenses: [],
        summary: {
            totalRevenue: 0,
            totalProfit: 0,
            profitMargin: 0,
            growthRate: 0
        }
    })
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('year')

    useEffect(() => {
        fetchFinancialData()
    }, [period])

    const fetchFinancialData = async () => {
        try {
            setLoading(true)
            const salesRes = await saleApi.getAll()
            const sales = salesRes.data || []

            // Calculate totals
            const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
            const estimatedCost = totalRevenue * 0.65 // 65% cost assumption
            const totalProfit = totalRevenue - estimatedCost

            // Generate monthly data
            const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
            const currentMonth = new Date().getMonth()

            const monthlyData = months.map((name, i) => {
                const baseRevenue = Math.floor(Math.random() * 60000) + 40000
                const baseCost = baseRevenue * (0.6 + Math.random() * 0.1)
                const baseProfit = baseRevenue - baseCost

                return {
                    name,
                    revenue: i <= currentMonth ? baseRevenue : null,
                    cost: i <= currentMonth ? Math.floor(baseCost) : null,
                    profit: i <= currentMonth ? Math.floor(baseProfit) : null,
                    projected: i > currentMonth
                }
            })

            setFinancialData({
                monthlyData,
                summary: {
                    totalRevenue,
                    totalProfit,
                    profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
                    growthRate: 12.5
                }
            })
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const exportReport = () => {
        const doc = new jsPDF()

        doc.setFontSize(20)
        doc.text('Rapport Financier', 20, 30)

        doc.setFontSize(12)
        doc.text(`Chiffre d'affaires: ${formatCurrency(financialData.summary.totalRevenue)}`, 20, 50)
        doc.text(`Profit: ${formatCurrency(financialData.summary.totalProfit)}`, 20, 60)
        doc.text(`Marge: ${formatPercent(financialData.summary.profitMargin)}`, 20, 70)
        doc.text(`Croissance: +${financialData.summary.growthRate}%`, 20, 80)

        doc.save('rapport_financier.pdf')
        toast.success('Rapport exporté')
    }

    if (loading) return <Loading />

    const summaryCards = [
        {
            title: 'Chiffre d\'Affaires',
            value: formatCompactNumber(financialData.summary.totalRevenue) + ' MAD',
            icon: DollarSign,
            change: '+12.5%',
            positive: true,
            color: 'success'
        },
        {
            title: 'Profit Net',
            value: formatCompactNumber(financialData.summary.totalProfit) + ' MAD',
            icon: TrendingUp,
            change: '+8.3%',
            positive: true,
            color: 'primary'
        },
        {
            title: 'Marge Bénéficiaire',
            value: formatPercent(financialData.summary.profitMargin),
            icon: BarChart3,
            change: '+2.1%',
            positive: true,
            color: 'warning'
        },
        {
            title: 'Croissance Annuelle',
            value: `+${financialData.summary.growthRate}%`,
            icon: TrendingUp,
            change: '+3.2%',
            positive: true,
            color: 'secondary'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Analyse Financière
                    </h1>
                    <p className="text-dark-500">Vue détaillée des performances financières</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm"
                    >
                        <option value="year">Cette année</option>
                        <option value="quarter">Ce trimestre</option>
                        <option value="month">Ce mois</option>
                    </select>
                    <Button onClick={exportReport}>
                        <Download className="w-5 h-5 mr-2" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-${card.color}-100 dark:bg-${card.color}-900/30 flex items-center justify-center`}>
                                    <card.icon className={`w-5 h-5 text-${card.color}-600`} />
                                </div>
                                <Badge variant={card.positive ? 'success' : 'danger'}>
                                    {card.positive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {card.change}
                                </Badge>
                            </div>
                            <p className="text-sm text-dark-500 mb-1">{card.title}</p>
                            <p className="text-2xl font-bold text-dark-900 dark:text-white">{card.value}</p>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Revenue vs Profit Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                Revenus vs Profit
                            </h3>
                            <p className="text-sm text-dark-500">Comparaison mensuelle</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-success-500" />
                                <span className="text-dark-500">Revenus</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-primary-500" />
                                <span className="text-dark-500">Profit</span>
                            </div>
                        </div>
                    </div>
                    {financialData.monthlyData && (
                        <MultiBarChartComponent
                            data={financialData.monthlyData.filter(d => d.revenue !== null).map(d => ({
                                name: d.name,
                                Revenus: d.revenue,
                                Profit: d.profit
                            }))}
                            dataKeys={['Revenus', 'Profit']}
                            colors={['#10B981', '#6366F1']}
                            height={350}
                        />
                    )}
                </Card>
            </motion.div>

            {/* Profit Margin Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Évolution de la Marge
                        </h3>
                        {financialData.monthlyData && (
                            <LineChartComponent
                                data={financialData.monthlyData
                                    .filter(d => d.revenue !== null)
                                    .map(d => ({
                                        name: d.name,
                                        value: d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : 0
                                    }))}
                                dataKey="value"
                                color="#F59E0B"
                                height={280}
                            />
                        )}
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                            Analyse des Coûts
                        </h3>
                        {financialData.monthlyData && (
                            <AreaChartComponent
                                data={financialData.monthlyData
                                    .filter(d => d.cost !== null)
                                    .map(d => ({ name: d.name, value: d.cost }))}
                                dataKey="value"
                                color="#EF4444"
                                height={280}
                            />
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Key Metrics Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <Card className="overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                        <h3 className="font-semibold text-dark-900 dark:text-white">
                            Métriques Clés par Mois
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-50 dark:bg-dark-800/50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-dark-500">Mois</th>
                                    <th className="text-right px-6 py-3 text-sm font-medium text-dark-500">Revenus</th>
                                    <th className="text-right px-6 py-3 text-sm font-medium text-dark-500">Coûts</th>
                                    <th className="text-right px-6 py-3 text-sm font-medium text-dark-500">Profit</th>
                                    <th className="text-right px-6 py-3 text-sm font-medium text-dark-500">Marge</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                                {financialData.monthlyData?.filter(d => d.revenue !== null).map((row, index) => (
                                    <tr key={index} className="hover:bg-dark-50 dark:hover:bg-dark-800/50">
                                        <td className="px-6 py-4 font-medium text-dark-900 dark:text-white">{row.name}</td>
                                        <td className="px-6 py-4 text-right text-dark-600 dark:text-dark-400">
                                            {formatCurrency(row.revenue)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-danger-600">
                                            {formatCurrency(row.cost)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-success-600 font-medium">
                                            {formatCurrency(row.profit)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Badge variant="success">
                                                {row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : 0}%
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}
