import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText, Calendar, Filter, Printer, ChevronDown,
    FileSpreadsheet, TrendingUp, DollarSign, PieChart,
    Clock, RefreshCw, Download, BarChart3, Briefcase
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { analyticsApi } from '../../api'
import { Card, Button, Loading, Badge } from '../../components/ui'
import { formatDate, formatCurrency, formatNumber, formatPercent, formatCompactNumber } from '../../utils/formatters'
import { jsPDF } from 'jspdf'
import toast from 'react-hot-toast'

export default function InvestorReports() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [kpiData, setKpiData] = useState(null)
    const [categoryData, setCategoryData] = useState([])
    const [monthlySales, setMonthlySales] = useState([])
    const printRef = useRef(null)

    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reportType: 'financial'
    })

    const [reportData, setReportData] = useState(null)
    const [generatedReports, setGeneratedReports] = useState([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [kpiRes, categoryRes, monthlyRes] = await Promise.all([
                analyticsApi.getKPI().catch(() => ({ data: null })),
                analyticsApi.getCategoryStats().catch(() => ({ data: [] })),
                analyticsApi.getMonthlySales().catch(() => ({ data: null }))
            ])

            setKpiData(kpiRes.data)
            const cats = categoryRes.data?.value || categoryRes.data || []
            setCategoryData(Array.isArray(cats) ? cats : [])
            setMonthlySales(monthlyRes.data?.list || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateReport = async () => {
        setGenerating(true)
        try {
            await fetchData()
            await new Promise(resolve => setTimeout(resolve, 500))

            const startDate = new Date(filters.startDate)
            const endDate = new Date(filters.endDate)
            const periodDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))

            // Financial metrics
            const totalRevenue = kpiData?.sales?.totalRevenue || 0
            const totalSales = kpiData?.sales?.salesCount || 0
            const avgBasket = kpiData?.sales?.averageBasket || 0
            const estimatedProfit = totalRevenue * 0.35
            const profitMargin = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0

            // Category breakdown
            const categoryBreakdown = categoryData.map(cat => ({
                name: cat.categoryName || cat.name || 'Catégorie',
                revenue: cat.totalRevenue || cat.revenue || 0,
                productCount: cat.productCount || 0,
                share: totalRevenue > 0 ? ((cat.totalRevenue || 0) / totalRevenue) * 100 : 0
            })).sort((a, b) => b.revenue - a.revenue)

            // Monthly trend
            const monthlyTrend = monthlySales.map(m => ({
                month: m.month,
                revenue: m.revenue || 0,
                profit: (m.revenue || 0) * 0.35
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
                    totalRevenue,
                    estimatedProfit,
                    profitMargin,
                    totalSales,
                    avgBasket,
                    periodDays,
                    growthRate: 12.5
                },
                categoryBreakdown,
                monthlyTrend
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
            `Rapport Investisseur - ${user?.username || 'Investisseur'}`,
            `Période: ${formatDate(reportData.period.start)} - ${formatDate(reportData.period.end)}`,
            `Généré le: ${formatDate(reportData.generatedAt)}`,
            '',
            'RÉSUMÉ FINANCIER',
            `Chiffre d'Affaires: ${reportData.summary.totalRevenue}`,
            `Profit Estimé: ${reportData.summary.estimatedProfit}`,
            `Marge: ${reportData.summary.profitMargin.toFixed(1)}%`,
            `Transactions: ${reportData.summary.totalSales}`,
            `Panier Moyen: ${reportData.summary.avgBasket}`,
            '',
            'RÉPARTITION PAR CATÉGORIE',
            'Catégorie,Revenus,Produits,Part (%)'
        ]

        reportData.categoryBreakdown.forEach(cat => {
            lines.push(`"${cat.name}",${cat.revenue},${cat.productCount},${cat.share.toFixed(1)}%`)
        })

        if (reportData.monthlyTrend.length > 0) {
            lines.push('')
            lines.push('ÉVOLUTION MENSUELLE')
            lines.push('Mois,Revenus,Profit')
            reportData.monthlyTrend.forEach(m => {
                lines.push(`${m.month},${m.revenue},${m.profit.toFixed(0)}`)
            })
        }

        const csvContent = lines.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `rapport_investisseur_${filters.startDate}_${filters.endDate}.csv`
        link.click()
        toast.success('Export CSV téléchargé!')
    }

    const exportToPDF = () => {
        if (!reportData) return

        const doc = new jsPDF()
        let y = 20

        // Header
        doc.setFontSize(20)
        doc.setTextColor(33, 33, 33)
        doc.text('Rapport Investisseur', 20, y)
        y += 10

        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Période: ${formatDate(reportData.period.start)} - ${formatDate(reportData.period.end)}`, 20, y)
        y += 5
        doc.text(`Généré le: ${formatDate(reportData.generatedAt)}`, 20, y)
        y += 15

        // Summary
        doc.setFontSize(14)
        doc.setTextColor(33, 33, 33)
        doc.text('Résumé Financier', 20, y)
        y += 10

        doc.setFontSize(11)
        doc.text(`Chiffre d'Affaires: ${formatCurrency(reportData.summary.totalRevenue)}`, 25, y)
        y += 7
        doc.text(`Profit Estimé: ${formatCurrency(reportData.summary.estimatedProfit)}`, 25, y)
        y += 7
        doc.text(`Marge Bénéficiaire: ${reportData.summary.profitMargin.toFixed(1)}%`, 25, y)
        y += 7
        doc.text(`Nombre de Transactions: ${reportData.summary.totalSales}`, 25, y)
        y += 7
        doc.text(`Panier Moyen: ${formatCurrency(reportData.summary.avgBasket)}`, 25, y)
        y += 7
        doc.text(`Croissance: +${reportData.summary.growthRate}%`, 25, y)
        y += 15

        // Categories
        doc.setFontSize(14)
        doc.text('Répartition par Catégorie', 20, y)
        y += 10

        doc.setFontSize(10)
        reportData.categoryBreakdown.slice(0, 8).forEach(cat => {
            doc.text(`${cat.name}: ${formatCurrency(cat.revenue)} (${cat.share.toFixed(1)}%)`, 25, y)
            y += 6
        })

        doc.save(`rapport_investisseur_${filters.startDate}_${filters.endDate}.pdf`)
        toast.success('Export PDF téléchargé!')
    }

    const printReport = () => {
        if (!reportData) return
        window.print()
        toast.success('Impression lancée!')
    }

    const quickReport = (type) => {
        const today = new Date()
        let startDate

        switch (type) {
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3)
                startDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0]
                break
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
                break
            case 'month':
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
        }

        setFilters(prev => ({
            ...prev,
            startDate,
            endDate: new Date().toISOString().split('T')[0]
        }))
        setTimeout(generateReport, 100)
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Rapports</h1>
                    <p className="text-dark-500">Générez des rapports financiers détaillés</p>
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
                                        <option value="financial">Financier</option>
                                        <option value="performance">Performance</option>
                                        <option value="portfolio">Portfolio</option>
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
                                            Rapport Financier
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
                                        <Button variant="outline" size="sm" onClick={exportToPDF}>
                                            <Download className="w-4 h-4 mr-2" />
                                            PDF
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={printReport}>
                                            <Printer className="w-4 h-4 mr-2" />
                                            Imprimer
                                        </Button>
                                    </div>
                                </div>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-xl text-center">
                                        <DollarSign className="w-8 h-8 text-success-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-success-600">
                                            {formatCompactNumber(reportData.summary.totalRevenue)} MAD
                                        </p>
                                        <p className="text-sm text-dark-500">Chiffre d'Affaires</p>
                                    </div>
                                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-center">
                                        <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-primary-600">
                                            {formatCompactNumber(reportData.summary.estimatedProfit)} MAD
                                        </p>
                                        <p className="text-sm text-dark-500">Profit Estimé</p>
                                    </div>
                                    <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl text-center">
                                        <BarChart3 className="w-8 h-8 text-warning-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-warning-600">
                                            {reportData.summary.profitMargin.toFixed(1)}%
                                        </p>
                                        <p className="text-sm text-dark-500">Marge</p>
                                    </div>
                                </div>

                                {/* Additional metrics */}
                                <div className="grid grid-cols-3 gap-4 p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-dark-900 dark:text-white">
                                            {formatNumber(reportData.summary.totalSales)}
                                        </p>
                                        <p className="text-sm text-dark-500">Transactions</p>
                                    </div>
                                    <div className="text-center border-x border-dark-200 dark:border-dark-700">
                                        <p className="text-lg font-bold text-dark-900 dark:text-white">
                                            {formatCurrency(reportData.summary.avgBasket)}
                                        </p>
                                        <p className="text-sm text-dark-500">Panier Moyen</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-success-600">
                                            +{reportData.summary.growthRate}%
                                        </p>
                                        <p className="text-sm text-dark-500">Croissance</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Category Breakdown */}
                            {reportData.categoryBreakdown.length > 0 && (
                                <Card className="p-6 mt-6">
                                    <h3 className="font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                                        <PieChart className="w-5 h-5 text-primary-600" />
                                        Répartition par Catégorie
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-dark-100 dark:border-dark-800">
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-500">Catégorie</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Revenus</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Produits</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Part</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.categoryBreakdown.map((cat, index) => (
                                                    <tr key={index} className="border-b border-dark-50 dark:border-dark-800">
                                                        <td className="py-3 px-4 font-medium text-dark-900 dark:text-white">
                                                            {cat.name}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-success-600 font-medium">
                                                            {formatCurrency(cat.revenue)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-dark-700 dark:text-dark-300">
                                                            {formatNumber(cat.productCount)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-16 h-2 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary-500 rounded-full"
                                                                        style={{ width: `${cat.share}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm text-dark-500 w-12 text-right">
                                                                    {cat.share.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}

                            {/* Monthly Trend */}
                            {reportData.monthlyTrend.length > 0 && (
                                <Card className="p-6 mt-6">
                                    <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                                        Évolution Mensuelle
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-dark-100 dark:border-dark-800">
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-500">Mois</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Revenus</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-500">Profit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.monthlyTrend.map((month, index) => (
                                                    <tr key={index} className="border-b border-dark-50 dark:border-dark-800">
                                                        <td className="py-3 px-4 text-dark-900 dark:text-white">{month.month}</td>
                                                        <td className="py-3 px-4 text-right text-dark-700 dark:text-dark-300">
                                                            {formatCurrency(month.revenue)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-medium text-success-600">
                                                            {formatCurrency(month.profit)}
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
                                Cliquez sur "Générer" pour créer un rapport financier détaillé
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
                                                ? 'border-warning-500 bg-warning-50 dark:bg-warning-900/20'
                                                : 'border-dark-100 dark:border-dark-800 hover:border-warning-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${reportData?.id === report.id
                                                    ? 'bg-warning-500 text-white'
                                                    : 'bg-dark-100 dark:bg-dark-700 text-dark-500'
                                                }`}>
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-dark-900 dark:text-white truncate">
                                                    {formatDate(report.period.start)}
                                                </p>
                                                <p className="text-sm text-dark-500">
                                                    {formatCompactNumber(report.summary.totalRevenue)} MAD
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
                                onClick={() => quickReport('month')}
                            >
                                <Clock className="w-4 h-4 mr-3" />
                                Rapport mensuel
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => quickReport('quarter')}
                            >
                                <Calendar className="w-4 h-4 mr-3" />
                                Rapport trimestriel
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => quickReport('year')}
                            >
                                <TrendingUp className="w-4 h-4 mr-3" />
                                Rapport annuel
                            </Button>
                        </div>
                    </Card>

                    {/* KPI Preview */}
                    {kpiData && (
                        <Card className="p-6">
                            <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                                Aperçu Global
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-dark-500">CA Total</span>
                                    <span className="font-semibold text-success-600">
                                        {formatCompactNumber(kpiData.sales?.totalRevenue || 0)} MAD
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-dark-500">Transactions</span>
                                    <span className="font-semibold text-dark-900 dark:text-white">
                                        {formatNumber(kpiData.sales?.salesCount || 0)}
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
                    body * { visibility: hidden; }
                    .print\\:p-8, .print\\:p-8 * { visibility: visible; }
                    .print\\:hidden { display: none !important; }
                    .print\\:p-8 { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
        </div>
    )
}
