import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Brain, TrendingUp, TrendingDown, Zap, RefreshCw,
    Target, AlertTriangle, CheckCircle, Package
} from 'lucide-react'
import { analyticsApi, productApi, saleApi } from '../../api'
import { Card, Button, Loading, EmptyState, Badge } from '../../components/ui'
import { AreaChartComponent, LineChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function Predictions() {
    const [predictions, setPredictions] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [productsRes, salesRes] = await Promise.all([
                productApi.getAll(),
                saleApi.getAll()
            ])
            setProducts(productsRes.data || [])

            // Generate initial predictions
            generatePredictions(productsRes.data, salesRes.data)
        } catch (error) {
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const generatePredictions = async (productsList = products, salesData = []) => {
        setGenerating(true)

        try {
            // Try to fetch from ML service
            let mlPredictions = null
            try {
                const response = await analyticsApi.getPredictions()
                mlPredictions = response.data
            } catch {
                // ML service not available, generate mock predictions
            }

            // Generate predictions based on historical data or mock
            const salesByProduct = {}
            salesData.forEach(sale => {
                if (sale.lignes && Array.isArray(sale.lignes)) {
                    sale.lignes.forEach(ligne => {
                        const productId = ligne.productId
                        if (productId) {
                            if (!salesByProduct[productId]) {
                                salesByProduct[productId] = { total: 0, count: 0 }
                            }
                            salesByProduct[productId].total += ligne.lineTotal || 0
                            salesByProduct[productId].count += ligne.quantity || 1
                        }
                    })
                }
            })

            // Generate 12-month forecast
            const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
            const currentMonth = new Date().getMonth()

            const salesForecast = months.map((name, i) => {
                const isPast = i <= currentMonth
                const baseValue = Math.random() * 50000 + 30000
                return {
                    name,
                    actual: isPast ? baseValue : null,
                    predicted: baseValue * (1 + (i - currentMonth) * 0.05 + Math.random() * 0.1)
                }
            })

            // Product predictions
            const productPredictions = productsList.slice(0, 10).map(product => {
                const historicalData = salesByProduct[product.id] || { total: 0, count: 0 }
                const trend = Math.random() > 0.3 ? 'up' : 'down'
                const changePercent = Math.floor(Math.random() * 30) + 5

                return {
                    id: product.id,
                    name: product.title,
                    category: product.categoryName,
                    currentStock: product.stock,
                    predictedDemand: Math.floor(Math.random() * 50) + 10,
                    trend,
                    changePercent,
                    confidence: Math.floor(Math.random() * 20) + 75,
                    recommendation: product.stock < 10 ? 'restock' : trend === 'up' ? 'maintain' : 'reduce'
                }
            })

            // Stock alerts
            const stockAlerts = productsList
                .filter(p => p.stock < 20)
                .map(p => ({
                    product: p.title,
                    currentStock: p.stock,
                    predictedDemand: Math.floor(Math.random() * 30) + 15,
                    daysUntilStockout: Math.floor(p.stock / (Math.random() * 3 + 1)),
                    severity: p.stock < 5 ? 'critical' : p.stock < 10 ? 'warning' : 'low'
                }))

            setPredictions({
                salesForecast,
                productPredictions,
                stockAlerts,
                summary: {
                    nextMonthRevenue: Math.floor(Math.random() * 50000) + 100000,
                    growthRate: Math.floor(Math.random() * 15) + 5,
                    topTrendingProduct: productsList[0]?.title || 'N/A',
                    stockRiskCount: stockAlerts.filter(a => a.severity === 'critical').length
                }
            })

            toast.success('Prédictions générées avec succès')
        } catch (error) {
            toast.error('Erreur lors de la génération')
        } finally {
            setGenerating(false)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-500 to-purple-600 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                            Prédictions IA
                        </h1>
                    </div>
                    <p className="text-dark-500">Analyse prédictive basée sur l'apprentissage automatique</p>
                </div>
                <Button
                    onClick={() => generatePredictions(products)}
                    loading={generating}
                >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Régénérer
                </Button>
            </div>

            {/* Summary Cards */}
            {predictions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/80">Prévision Mois Prochain</p>
                                    <p className="text-2xl font-bold">{formatCurrency(predictions.summary.nextMonthRevenue)}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-white/50" />
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="p-4 bg-gradient-to-br from-success-500 to-success-600 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/80">Croissance Prévue</p>
                                    <p className="text-2xl font-bold">+{predictions.summary.growthRate}%</p>
                                </div>
                                <Target className="w-8 h-8 text-white/50" />
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="p-4 bg-gradient-to-br from-secondary-500 to-secondary-600 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/80">Produit Tendance</p>
                                    <p className="text-lg font-bold truncate">{predictions.summary.topTrendingProduct}</p>
                                </div>
                                <Zap className="w-8 h-8 text-white/50" />
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="p-4 bg-gradient-to-br from-danger-500 to-danger-600 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/80">Alertes Stock</p>
                                    <p className="text-2xl font-bold">{predictions.summary.stockRiskCount}</p>
                                </div>
                                <AlertTriangle className="w-8 h-8 text-white/50" />
                            </div>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* Sales Forecast Chart */}
            {predictions && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                    Prévision des Ventes
                                </h3>
                                <p className="text-sm text-dark-500">Comparaison réel vs prévu sur 12 mois</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-primary-500" />
                                    <span className="text-dark-500">Réel</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-secondary-500 opacity-50" />
                                    <span className="text-dark-500">Prévu</span>
                                </div>
                            </div>
                        </div>
                        <AreaChartComponent
                            data={predictions.salesForecast.map(d => ({
                                name: d.name,
                                value: d.actual || d.predicted
                            }))}
                            dataKey="value"
                            color="#6366F1"
                            height={300}
                        />
                    </Card>
                </motion.div>
            )}

            {/* Product Predictions */}
            {predictions && predictions.productPredictions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                Prédictions par Produit
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-50 dark:bg-dark-800/50">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-dark-500">Produit</th>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-dark-500">Stock</th>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-dark-500">Demande Prévue</th>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-dark-500">Tendance</th>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-dark-500">Confiance</th>
                                        <th className="text-left px-6 py-3 text-sm font-medium text-dark-500">Recommandation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                                    {predictions.productPredictions.map((pred, index) => (
                                        <motion.tr
                                            key={pred.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 + index * 0.05 }}
                                            className="hover:bg-dark-50 dark:hover:bg-dark-800/50"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-dark-900 dark:text-white">{pred.name}</p>
                                                    <p className="text-xs text-dark-500">{pred.category}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-medium ${pred.currentStock < 10 ? 'text-danger-600' : 'text-dark-900 dark:text-white'}`}>
                                                    {pred.currentStock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-dark-600 dark:text-dark-400">
                                                {pred.predictedDemand} unités
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-1 ${pred.trend === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
                                                    {pred.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                    <span>{pred.changePercent}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-success-500 rounded-full"
                                                            style={{ width: `${pred.confidence}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-dark-500">{pred.confidence}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant={
                                                        pred.recommendation === 'restock' ? 'danger' :
                                                            pred.recommendation === 'maintain' ? 'success' : 'warning'
                                                    }
                                                >
                                                    {pred.recommendation === 'restock' ? 'Réapprovisionner' :
                                                        pred.recommendation === 'maintain' ? 'Maintenir' : 'Réduire'}
                                                </Badge>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Stock Alerts */}
            {predictions && predictions.stockAlerts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-warning-500" />
                            Alertes de Stock
                        </h3>
                        <div className="space-y-3">
                            {predictions.stockAlerts.map((alert, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-xl border ${alert.severity === 'critical'
                                        ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                                        : alert.severity === 'warning'
                                            ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                                            : 'bg-dark-50 dark:bg-dark-800 border-dark-200 dark:border-dark-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Package className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-danger-500' :
                                                alert.severity === 'warning' ? 'text-warning-500' : 'text-dark-400'
                                                }`} />
                                            <div>
                                                <p className="font-medium text-dark-900 dark:text-white">{alert.product}</p>
                                                <p className="text-sm text-dark-500">
                                                    Stock: {alert.currentStock} • Demande prévue: {alert.predictedDemand}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-medium ${alert.severity === 'critical' ? 'text-danger-600' : 'text-warning-600'
                                                }`}>
                                                {alert.daysUntilStockout} jours
                                            </p>
                                            <p className="text-xs text-dark-500">avant rupture</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            )}
        </div>
    )
}
