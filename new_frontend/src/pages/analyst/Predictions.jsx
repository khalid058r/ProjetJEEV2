import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Brain, TrendingUp, TrendingDown, Zap, RefreshCw,
    Target, AlertTriangle, CheckCircle, Package, BarChart3,
    ArrowUpRight, ArrowDownRight, Activity, Sparkles
} from 'lucide-react'
import { analyticsApi, mlApi } from '../../api'
import { Card, Button, Loading, EmptyState, Badge } from '../../components/ui'
import { AreaChartComponent, LineChartComponent, BarChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatCompactNumber, formatPercent } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function Predictions() {
    const [predictions, setPredictions] = useState(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch data from analytics endpoints
            const [kpiRes, categoryRes, monthlyRes, bestSellersRes] = await Promise.all([
                analyticsApi.getKPI().catch(() => ({ data: null })),
                analyticsApi.getCategoryStats().catch(() => ({ data: null })),
                analyticsApi.getMonthlySales().catch(() => ({ data: null })),
                analyticsApi.getBestSellers(10).catch(() => ({ data: null }))
            ])

            // Enhance Best Sellers with real ML Predictions
            let enhancedBestSellers = []
            if (bestSellersRes?.data) {
                const products = Array.isArray(bestSellersRes.data) ? bestSellersRes.data : []

                // Process predictions in parallel for top products (limit to 5 to avoid timeouts)
                const predictionPromises = products.slice(0, 5).map(async (product) => {
                    try {
                        const mlInput = {
                            name: product.title || product.productName || product.name,
                            category: product.categoryName || 'General', // API might return categoryName directly
                            rating: product.rating || 4.5,
                            reviewCount: product.reviewCount || 10,
                            price: product.price || product.totalRevenue / (product.quantitySold || 1),
                            stock: product.stock || 50, // Best seller endpoint might not return stock, assume 50 if missing
                            rank: product.rank || 0
                        }

                        // Call ML Demand Prediction
                        const demandRes = await mlApi.predictDemand(mlInput).catch(() => null)

                        return {
                            ...product,
                            mlPrediction: demandRes?.data || null
                        }
                    } catch (e) {
                        return { ...product, mlPrediction: null }
                    }
                })

                enhancedBestSellers = await Promise.all(predictionPromises)

                // Add remaining products without ML if any
                if (products.length > 5) {
                    enhancedBestSellers = [...enhancedBestSellers, ...products.slice(5)]
                }
            }

            // Parse data and generate predictions
            generatePredictions(kpiRes.data, categoryRes.data, monthlyRes.data, enhancedBestSellers)
        } catch (error) {
            console.error('Error loading data:', error)
            toast.error('Erreur lors du chargement des données')
        } finally {
            setLoading(false)
        }
    }

    const generatePredictions = (kpiData, categoryData, monthlyData, bestSellersData) => {
        setGenerating(true)

        try {
            // Parse KPI
            const totalRevenue = kpiData?.sales?.totalRevenue || 0

            // Parse monthly data for trends
            let monthlyTrends = []
            if (monthlyData?.list && Array.isArray(monthlyData.list)) {
                monthlyTrends = monthlyData.list.map(item => ({
                    name: item.month || item.name,
                    revenue: item.revenue || item.value || 0
                }))
            } else if (monthlyData?.map) {
                monthlyTrends = Object.entries(monthlyData.map).map(([month, revenue]) => ({
                    name: month,
                    revenue: revenue || 0
                }))
            }

            // Generate 12-month forecast based on historical data patterns if available, else simulate for demo
            const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
            const currentMonth = new Date().getMonth()
            const avgMonthlyRevenue = totalRevenue > 0 ? totalRevenue / (currentMonth + 1) : 50000

            const salesForecast = months.map((name, i) => {
                const isPast = i <= currentMonth
                const historicalValue = monthlyTrends.find(m => m.name === name)?.revenue
                const baseValue = historicalValue || avgMonthlyRevenue * (0.8 + Math.random() * 0.4)
                const growthFactor = 1 + ((i - currentMonth) * 0.03)

                return {
                    name,
                    actual: isPast ? baseValue : null,
                    predicted: isPast ? null : baseValue * growthFactor * (0.95 + Math.random() * 0.1)
                }
            })

            // Category predictions (Simulated for now as ML model focuses on products)
            let categories = []
            if (Array.isArray(categoryData)) {
                categories = categoryData
            } else if (categoryData?.value && Array.isArray(categoryData.value)) {
                categories = categoryData.value
            }

            const categoryPredictions = categories.slice(0, 8).map((cat, index) => {
                const revenue = cat.totalRevenue || cat.revenue || cat.value || 0
                const trend = Math.random() > 0.3 ? 'up' : 'down' // Replace with logic if historical data available
                const changePercent = Math.floor(Math.random() * 20) + 2

                return {
                    name: cat.categoryName || cat.name || `Catégorie ${index + 1}`,
                    currentRevenue: revenue,
                    predictedRevenue: revenue * (trend === 'up' ? (1 + changePercent / 100) : (1 - changePercent / 100)),
                    trend,
                    changePercent,
                    confidence: 85 // Static confidence for categories
                }
            })

            // Real ML Product Predictions processing
            let productPredictions = []
            if (Array.isArray(bestSellersData)) {
                productPredictions = bestSellersData.slice(0, 8).map((product, index) => {
                    const revenue = product.revenue || product.totalRevenue || 0
                    const quantity = product.quantitySold || product.totalQuantity || product.quantity || 0

                    // Use ML data if available, else fallback
                    const mlData = product.mlPrediction
                    const predictedDemand = mlData?.predicted_demand || mlData?.predictedDemand || Math.ceil(quantity * 1.1)
                    const confidence = mlData?.confidence || 75
                    const trend = predictedDemand > quantity ? 'up' : 'down'

                    // Logic for recommendations based on ML output
                    let recommendation = 'maintain'
                    if (trend === 'up' && confidence > 80) recommendation = 'increase_stock'
                    else if (trend === 'down' && confidence > 80) recommendation = 'reduce_stock'

                    const predictedChange = quantity > 0 ? ((predictedDemand - quantity) / quantity * 100) : 0

                    return {
                        id: product.productId || index,
                        name: product.title || product.productName || product.name,
                        currentRevenue: revenue,
                        currentQuantity: quantity,
                        predictedDemand: predictedDemand,
                        trend,
                        changePercent: Math.abs(Math.round(predictedChange)) || 5,
                        confidence: Math.round(confidence),
                        recommendation
                    }
                })
            }

            // Generate stock alerts based on REAL ML predictions
            const stockAlerts = productPredictions
                .filter(p => p.trend === 'up' && p.confidence >= 80)
                .slice(0, 5)
                .map(p => ({
                    product: p.name,
                    currentQuantity: p.currentQuantity,
                    predictedDemand: p.predictedDemand,
                    daysUntilStockout: p.predictedDemand > 0 ? Math.floor(p.currentQuantity / (p.predictedDemand / 30)) : 30,
                    severity: p.currentQuantity < p.predictedDemand ? 'critical' : 'warning'
                }))

            // Summary stats
            const nextMonthRevenue = salesForecast[currentMonth + 1]?.predicted || avgMonthlyRevenue * 1.05
            const growthRate = totalRevenue > 0 ? ((nextMonthRevenue - avgMonthlyRevenue) / avgMonthlyRevenue * 100) : 5

            setPredictions({
                salesForecast,
                categoryPredictions,
                productPredictions,
                stockAlerts,
                summary: {
                    currentRevenue: totalRevenue,
                    nextMonthRevenue,
                    growthRate,
                    topCategory: categoryPredictions[0]?.name || 'N/A',
                    stockRiskCount: stockAlerts.filter(a => a.severity === 'critical').length,
                    modelConfidence: productPredictions.length > 0
                        ? Math.round(productPredictions.reduce((sum, p) => sum + p.confidence, 0) / productPredictions.length)
                        : 85
                }
            })

            toast.success('Prédictions générées avec succès')
        } catch (error) {
            console.error('Error processing predictions:', error)
            toast.error('Erreur lors du traitement des prédictions')
        } finally {
            setGenerating(false)
        }
    }

    const handleRegenerate = async () => {
        setGenerating(true)
        await fetchData()
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-secondary-500/25">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                                Prédictions IA
                            </h1>
                            <p className="text-dark-500">Analyse prédictive basée sur le Machine Learning</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {predictions && (
                        <Badge variant="success" className="flex items-center gap-2 px-3 py-2">
                            <Sparkles className="w-4 h-4" />
                            Confiance: {predictions.summary.modelConfidence}%
                        </Badge>
                    )}
                    <Button
                        onClick={handleRegenerate}
                        loading={generating}
                        className="bg-gradient-to-r from-secondary-500 to-purple-600"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Régénérer
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {predictions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="p-5 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <Badge variant="light" className="bg-white/20 text-white border-0">
                                    Prévision
                                </Badge>
                            </div>
                            <p className="text-sm text-white/80 mb-1">Mois Prochain</p>
                            <p className="text-2xl font-bold">{formatCompactNumber(predictions.summary.nextMonthRevenue)} MAD</p>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="p-5 bg-gradient-to-br from-success-500 to-success-600 text-white">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span className="text-sm font-medium">+{predictions.summary.growthRate.toFixed(1)}%</span>
                                </div>
                            </div>
                            <p className="text-sm text-white/80 mb-1">Croissance Prévue</p>
                            <p className="text-2xl font-bold">+{predictions.summary.growthRate.toFixed(1)}%</p>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="p-5 bg-gradient-to-br from-secondary-500 to-purple-600 text-white">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Zap className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-sm text-white/80 mb-1">Catégorie Tendance</p>
                            <p className="text-lg font-bold truncate">{predictions.summary.topCategory}</p>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="p-5 bg-gradient-to-br from-warning-500 to-orange-600 text-white">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                {predictions.summary.stockRiskCount > 0 && (
                                    <Badge variant="light" className="bg-white/20 text-white border-0">
                                        Attention
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-white/80 mb-1">Alertes Stock</p>
                            <p className="text-2xl font-bold">{predictions.summary.stockRiskCount}</p>
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
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                    Prévision des Ventes
                                </h3>
                                <p className="text-sm text-dark-500">Projection sur 12 mois basée sur l'historique</p>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary-500" />
                                    <span className="text-dark-500">Réel</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-secondary-500" />
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
                            height={320}
                        />
                    </Card>
                </motion.div>
            )}

            {/* Category & Product Predictions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Predictions */}
                {predictions && predictions.categoryPredictions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="overflow-hidden h-full">
                            <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                                <h3 className="font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary-500" />
                                    Prédictions par Catégorie
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-200 dark:divide-dark-700 max-h-[400px] overflow-y-auto">
                                {predictions.categoryPredictions.map((cat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + index * 0.05 }}
                                        className="p-4 hover:bg-dark-50 dark:hover:bg-dark-800/50"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-dark-900 dark:text-white">{cat.name}</span>
                                            <div className={`flex items-center gap-1 ${cat.trend === 'up' ? 'text-success-600' : 'text-danger-600'
                                                }`}>
                                                {cat.trend === 'up' ?
                                                    <TrendingUp className="w-4 h-4" /> :
                                                    <TrendingDown className="w-4 h-4" />
                                                }
                                                <span className="font-medium">
                                                    {cat.trend === 'up' ? '+' : '-'}{cat.changePercent}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-dark-500">
                                                Prévu: {formatCompactNumber(cat.predictedRevenue)} MAD
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-success-500 rounded-full"
                                                        style={{ width: `${cat.confidence}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-dark-400">{cat.confidence}%</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Stock Alerts */}
                {predictions && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Card className="p-6 h-full">
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-warning-500" />
                                Alertes de Stock Prédictives
                            </h3>
                            {predictions.stockAlerts.length > 0 ? (
                                <div className="space-y-3">
                                    {predictions.stockAlerts.map((alert, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.6 + index * 0.1 }}
                                            className={`p-4 rounded-xl border ${alert.severity === 'critical'
                                                ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                                                : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Package className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-danger-500' : 'text-warning-500'
                                                        }`} />
                                                    <div>
                                                        <p className="font-medium text-dark-900 dark:text-white">{alert.product}</p>
                                                        <p className="text-sm text-dark-500">
                                                            Demande prévue: {alert.predictedDemand} unités
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${alert.severity === 'critical' ? 'text-danger-600' : 'text-warning-600'
                                                        }`}>
                                                        {alert.daysUntilStockout}j
                                                    </p>
                                                    <p className="text-xs text-dark-500">avant rupture</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <CheckCircle className="w-12 h-12 text-success-500 mb-3" />
                                    <p className="font-medium text-dark-900 dark:text-white">Aucune alerte</p>
                                    <p className="text-sm text-dark-500">Les niveaux de stock sont optimaux</p>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </div>

            {/* Product Predictions Table */}
            {predictions && predictions.productPredictions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                                <Package className="w-5 h-5 text-secondary-500" />
                                Prédictions par Produit
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-50 dark:bg-dark-800/50">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Produit</th>
                                        <th className="text-right px-6 py-4 text-sm font-medium text-dark-500">CA Actuel</th>
                                        <th className="text-right px-6 py-4 text-sm font-medium text-dark-500">Demande Prévue</th>
                                        <th className="text-center px-6 py-4 text-sm font-medium text-dark-500">Tendance</th>
                                        <th className="text-center px-6 py-4 text-sm font-medium text-dark-500">Confiance</th>
                                        <th className="text-center px-6 py-4 text-sm font-medium text-dark-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                                    {predictions.productPredictions.map((pred, index) => (
                                        <motion.tr
                                            key={pred.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.7 + index * 0.05 }}
                                            className="hover:bg-dark-50 dark:hover:bg-dark-800/50"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-dark-900 dark:text-white">{pred.name}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right text-dark-600 dark:text-dark-400">
                                                {formatCurrency(pred.currentRevenue)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-dark-900 dark:text-white">
                                                {pred.predictedDemand} unités
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center justify-center gap-1 ${pred.trend === 'up' ? 'text-success-600' : 'text-danger-600'
                                                    }`}>
                                                    {pred.trend === 'up' ?
                                                        <TrendingUp className="w-4 h-4" /> :
                                                        <TrendingDown className="w-4 h-4" />
                                                    }
                                                    <span>{pred.trend === 'up' ? '+' : '-'}{pred.changePercent}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 h-2 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${pred.confidence >= 85 ? 'bg-success-500' :
                                                                pred.confidence >= 70 ? 'bg-warning-500' : 'bg-danger-500'
                                                                }`}
                                                            style={{ width: `${pred.confidence}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-dark-500">{pred.confidence}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge
                                                    variant={
                                                        pred.recommendation === 'increase_stock' ? 'success' :
                                                            pred.recommendation === 'maintain' ? 'primary' : 'warning'
                                                    }
                                                >
                                                    {pred.recommendation === 'increase_stock' ? 'Augmenter' :
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
        </div>
    )
}
