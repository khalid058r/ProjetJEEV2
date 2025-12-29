import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText, Calendar, Filter, Printer, ChevronDown,
    FileSpreadsheet, TrendingUp, ShoppingCart, DollarSign,
    Clock, RefreshCw, Award
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { analyticsApi } from '../../api'
import { Card, Button, Loading } from '../../components/ui'
import { formatDate, formatCurrency, formatNumber } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function VendeurReports() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [kpiData, setKpiData] = useState(null)
    const [dailySales, setDailySales] = useState([])
    const [bestSellers, setBestSellers] = useState([])
    const [showFilters, setShowFilters] = useState(false)
    const printRef = useRef(null)

    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reportType: 'sales'
    })

    const [reportData, setReportData] = useState(null)
    const [generatedReports, setGeneratedReports] = useState([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [kpiRes, dailyRes, bestSellersRes] = await Promise.all([
                analyticsApi.getVendeurKPI().catch(() => ({ data: null })),
                analyticsApi.getVendeurDailySales().catch(() => ({ data: [] })),
                analyticsApi.getVendeurBestSellers(10).catch(() => ({ data: [] }))
            ])

            // Parse response structures
            setKpiData(kpiRes.data)
            setDailySales(Array.isArray(dailyRes.data) ? dailyRes.data : dailyRes.data?.value || [])
            setBestSellers(Array.isArray(bestSellersRes.data) ? bestSellersRes.data : bestSellersRes.data?.value || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateReport = async () => {
        setGenerating(true)
        try {
            // Refresh data
            await fetchData()
            await new Promise(resolve => setTimeout(resolve, 500))

            const startDate = new Date(filters.startDate)
            const endDate = new Date(filters.endDate)
            endDate.setHours(23, 59, 59)
            const periodDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))

            // Use KPI data for summary
            const totalSales = kpiData?.sales?.salesCount || kpiData?.totals?.sales || 0
            const totalRevenue = kpiData?.sales?.totalRevenue || kpiData?.totals?.revenue || 0
            const avgOrderValue = kpiData?.sales?.averageBasket || (totalSales > 0 ? totalRevenue / totalSales : 0)

            // Format top products
            const topProducts = bestSellers.map((p, i) => ({
                id: p.id || i,
                name: p.title || p.name || p.productName || 'Produit',
                quantity: p.totalQuantity || p.quantity || 0,
                revenue: p.totalRevenue || p.revenue || 0
            }))

            // Format daily data
            const dailyData = dailySales.map(d => ({
                date: d.date || d.day,
                count: d.salesCount || d.count || 0,
                revenue: d.revenue || d.totalRevenue || 0
            }))

            const report = {
                id: Date.now(),
                type: filters.reportType,
                period: {
                    start: filters.startDate,
                    end: filters.endDate
                },
                generatedAt: new Date().toISOString(),
                summary: {
                    totalSales,
                    totalRevenue,
                    avgOrderValue,
                    periodDays
                },
                topProducts,
                dailyData
            }

            setReportData(report)
            setGeneratedReports(prev => [report, ...prev.slice(0, 9)])
            toast.success('Rapport généré avec succès!')
        } catch (error) {
            console.error('Error generating report:', error)
            toast.error('Erreur lors de la génération')
        } finally {
            setGenerating(false)
        }
    }

    const exportToCSV = () => {
        if (!reportData) return

        const lines = [
            `Rapport de Ventes - ${user?.username || 'Vendeur'}`,
            `Période: ${formatDate(reportData.period.start)} - ${formatDate(reportData.period.end)}`,
            `Généré le: ${formatDate(reportData.generatedAt)}`,
            '',
            'RÉSUMÉ',
            `Total Ventes: ${reportData.summary.totalSales}`,
            `CA Total: ${reportData.summary.totalRevenue}`,
            `Panier Moyen: ${reportData.summary.avgOrderValue}`,
            '',
            'TOP PRODUITS',
            'Rang,Produit,Quantité,CA'
        ]

        reportData.topProducts.forEach((p, i) => {
            lines.push(`${i + 1},"${p.name}",${p.quantity},${p.revenue}`)
        })

        if (reportData.dailyData.length > 0) {
            lines.push('')
            lines.push('VENTES JOURNALIÈRES')
            lines.push('Date,Ventes,CA')
            reportData.dailyData.forEach(d => {
                lines.push(`${d.date},${d.count},${d.revenue}`)
            })
        }

        const csvContent = lines.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `rapport_ventes_${filters.startDate}_${filters.endDate}.csv`
        link.click()
        toast.success('Export CSV téléchargé!')
    }

    const printReport = () => {
        if (!reportData) return
        window.print()
        toast.success('Impression lancée!')
    }

    const quickReport = (type) => {
        const today = new Date()
        let startDate, endDate = new Date().toISOString().split('T')[0]

        switch (type) {
            case 'day':
                startDate = endDate
                break
            case 'week':
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)
                startDate = weekAgo.toISOString().split('T')[0]
                break
            case 'month':
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
                startDate = firstDay.toISOString().split('T')[0]
                break
            default:
                startDate = endDate
        }

        setFilters(prev => ({ ...prev, startDate, endDate }))
        setTimeout(generateReport, 100)
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Mes Rapports</h1>
                    <p className="text-dark-500">Générez et exportez vos rapports de ventes</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filtres
                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>
                    <Button onClick={generateReport} loading={generating}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Générer
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                        Date de début
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                        Date de fin
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                        Type de rapport
                                    </label>
                                    <select
                                        value={filters.reportType}
                                        onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value }))}
                                        className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                                    >
                                        <option value="sales">Ventes</option>
                                        <option value="products">Produits</option>
                                        <option value="performance">Performance</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={generateReport} loading={generating} className="w-full">
                                        Appliquer
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Report Preview */}
                <div className="lg:col-span-2 space-y-6">
                    {reportData ? (
                        <div ref={printRef} className="print:p-8">
                            {/* Report Header */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-dark-900 dark:text-white">
                                            Rapport de Ventes
                                        </h2>
                                        <p className="text-dark-500">
                                            {formatDate(reportData.period.start)} - {formatDate(reportData.period.end)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 print:hidden">
                                        <Button variant="outline" size="sm" onClick={exportToCSV}>
                                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                                            CSV
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={printReport}>
                                            <Printer className="w-4 h-4 mr-2" />
                                            Imprimer
                                        </Button>
                                    </div>
                                </div>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-center">
                                        <ShoppingCart className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-primary-600">
                                            {formatNumber(reportData.summary.totalSales)}
                                        </p>
                                        <p className="text-sm text-dark-500">Ventes</p>
                                    </div>
                                    <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-xl text-center">
                                        <DollarSign className="w-8 h-8 text-success-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-success-600">
                                            {formatCurrency(reportData.summary.totalRevenue)}
                                        </p>
                                        <p className="text-sm text-dark-500">CA Total</p>
                                    </div>
                                    <div className="p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl text-center">
                                        <TrendingUp className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-secondary-600">
                                            {formatCurrency(reportData.summary.avgOrderValue)}
                                        </p>
                                        <p className="text-sm text-dark-500">Panier Moyen</p>
                                    </div>
                                    <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl text-center">
                                        <Calendar className="w-8 h-8 text-warning-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-warning-600">
                                            {reportData.summary.periodDays}
                                        </p>
                                        <p className="text-sm text-dark-500">Jours</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Top Products Table */}
                            {reportData.topProducts.length > 0 && (
                                <Card className="p-6 mt-6">
                                    <h3 className="font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-yellow-500" />
                                        Top Produits Vendus
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-dark-100 dark:border-dark-800">
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-500">#</th>
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-500">Produit</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Qté</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">CA</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.topProducts.map((product, index) => (
                                                    <tr key={product.id || index} className="border-b border-dark-50 dark:border-dark-800">
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                    index === 1 ? 'bg-gray-100 text-gray-700' :
                                                                        index === 2 ? 'bg-amber-100 text-amber-700' :
                                                                            'bg-dark-100 text-dark-500'
                                                                }`}>
                                                                {index + 1}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 font-medium text-dark-900 dark:text-white">
                                                            {product.name}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-dark-700 dark:text-dark-300">
                                                            {formatNumber(product.quantity)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-medium text-success-600">
                                                            {formatCurrency(product.revenue)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}

                            {/* Daily Breakdown */}
                            {reportData.dailyData.length > 0 && (
                                <Card className="p-6 mt-6">
                                    <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                                        Détail Journalier
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-dark-100 dark:border-dark-800">
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-500">Date</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Ventes</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">CA</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.dailyData.map((day, index) => (
                                                    <tr key={index} className="border-b border-dark-50 dark:border-dark-800">
                                                        <td className="py-3 px-4 text-dark-900 dark:text-white">{day.date}</td>
                                                        <td className="py-3 px-4 text-right text-dark-700 dark:text-dark-300">
                                                            {formatNumber(day.count)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-medium text-success-600">
                                                            {formatCurrency(day.revenue)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <Card className="p-12 text-center">
                            <FileText className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                                Aucun rapport généré
                            </h3>
                            <p className="text-dark-500 mb-6">
                                Cliquez sur "Générer" pour créer un rapport basé sur vos données de vente
                            </p>
                            <Button onClick={generateReport} loading={generating}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Générer un rapport
                            </Button>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Recent Reports */}
                    <Card className="p-6">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                            Rapports Récents
                        </h3>
                        {generatedReports.length > 0 ? (
                            <div className="space-y-3">
                                {generatedReports.map((report, index) => (
                                    <motion.button
                                        key={report.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => setReportData(report)}
                                        className={`w-full p-4 rounded-xl border text-left transition-all ${reportData?.id === report.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-dark-100 dark:border-dark-800 hover:border-primary-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${reportData?.id === report.id
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-dark-100 dark:bg-dark-700 text-dark-500'
                                                }`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-dark-900 dark:text-white truncate">
                                                    {formatDate(report.period.start)}
                                                </p>
                                                <p className="text-sm text-dark-500">
                                                    {report.summary.totalSales} ventes • {formatCurrency(report.summary.totalRevenue)}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-dark-500 text-center py-4">
                                Aucun rapport généré
                            </p>
                        )}
                    </Card>

                    {/* Quick Actions */}
                    <Card className="p-6">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                            Actions Rapides
                        </h3>
                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => quickReport('day')}
                            >
                                <Clock className="w-4 h-4 mr-3" />
                                Rapport du jour
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => quickReport('week')}
                            >
                                <Calendar className="w-4 h-4 mr-3" />
                                Rapport hebdomadaire
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => quickReport('month')}
                            >
                                <TrendingUp className="w-4 h-4 mr-3" />
                                Rapport mensuel
                            </Button>
                        </div>
                    </Card>

                    {/* Current Stats Preview */}
                    {kpiData && (
                        <Card className="p-6">
                            <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                                Aperçu Global
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-dark-500">Total Ventes</span>
                                    <span className="font-semibold text-dark-900 dark:text-white">
                                        {formatNumber(kpiData.sales?.salesCount || kpiData.totals?.sales || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-dark-500">CA Total</span>
                                    <span className="font-semibold text-success-600">
                                        {formatCurrency(kpiData.sales?.totalRevenue || kpiData.totals?.revenue || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-dark-500">Panier Moyen</span>
                                    <span className="font-semibold text-primary-600">
                                        {formatCurrency(kpiData.sales?.averageBasket || 0)}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:p-8, .print\\:p-8 * {
                        visibility: visible;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:p-8 {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    )
}
