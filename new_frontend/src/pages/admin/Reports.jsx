import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
    FileText, Download, Calendar, Filter, RefreshCw, Printer,
    BarChart3, PieChart, TrendingUp, Package, ShoppingCart, Users,
    DollarSign, ArrowLeft, FileSpreadsheet, Eye
} from 'lucide-react'
import { productApi, saleApi, userApi, categoryApi } from '../../api'
import { Card, Button, Loading, Badge, Modal, DateRangePicker } from '../../components/ui'
import { AreaChartComponent, BarChartComponent, PieChartComponent } from '../../components/charts'
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

// Report types configuration
const REPORT_TYPES = [
    { id: 'sales', title: 'Rapport des Ventes', icon: ShoppingCart, color: 'success' },
    { id: 'products', title: 'Rapport des Produits', icon: Package, color: 'primary' },
    { id: 'users', title: 'Rapport des Utilisateurs', icon: Users, color: 'secondary' },
    { id: 'inventory', title: 'Rapport d\'Inventaire', icon: FileSpreadsheet, color: 'warning' },
    { id: 'performance', title: 'Performance Vendeurs', icon: TrendingUp, color: 'danger' }
]

export default function Reports() {
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [data, setData] = useState({
        products: [],
        sales: [],
        users: [],
        categories: []
    })
    const [selectedReport, setSelectedReport] = useState(null)
    const [showPreview, setShowPreview] = useState(false)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })
    const printRef = useRef()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [productsRes, salesRes, usersRes, categoriesRes] = await Promise.all([
                productApi.getAll().catch(() => ({ data: [] })),
                saleApi.getAll().catch(() => ({ data: [] })),
                userApi.getAll().catch(() => ({ data: [] })),
                categoryApi.getAll().catch(() => ({ data: [] }))
            ])
            setData({
                products: productsRes.data || [],
                sales: salesRes.data || [],
                users: usersRes.data || [],
                categories: categoriesRes.data || []
            })
        } catch (error) {
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    // Filter sales by date range
    const filteredSales = data.sales.filter(sale => {
        const saleDate = new Date(sale.saleDate)
        return saleDate >= new Date(dateRange.start) && saleDate <= new Date(dateRange.end)
    })

    // Calculate report data
    const generateReportData = (type) => {
        switch (type) {
            case 'sales':
                const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                const avgOrder = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0

                // Sales by day
                const salesByDay = {}
                filteredSales.forEach(sale => {
                    const day = new Date(sale.saleDate).toLocaleDateString('fr-FR')
                    if (!salesByDay[day]) salesByDay[day] = { date: day, ventes: 0, revenue: 0 }
                    salesByDay[day].ventes++
                    salesByDay[day].revenue += sale.totalAmount || 0
                })

                return {
                    title: 'Rapport des Ventes',
                    period: `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`,
                    stats: [
                        { label: 'Total Ventes', value: filteredSales.length },
                        { label: 'Chiffre d\'affaires', value: formatCurrency(totalRevenue) },
                        { label: 'Panier moyen', value: formatCurrency(avgOrder) },
                        { label: 'Ventes annulées', value: filteredSales.filter(s => s.status === 'CANCELLED').length }
                    ],
                    chartData: Object.values(salesByDay).slice(-14),
                    tableData: filteredSales.slice(0, 20).map(s => ({
                        id: s.id,
                        date: formatDate(s.saleDate),
                        vendeur: s.username,
                        articles: s.lignes?.length || 0,
                        total: formatCurrency(s.totalAmount),
                        statut: s.status
                    }))
                }

            case 'products':
                const productSales = {}
                filteredSales.forEach(sale => {
                    sale.lignes?.forEach(ligne => {
                        const id = ligne.productId
                        if (!productSales[id]) {
                            productSales[id] = {
                                name: ligne.productTitle,
                                quantity: 0,
                                revenue: 0
                            }
                        }
                        productSales[id].quantity += ligne.quantity || 0
                        productSales[id].revenue += ligne.lineTotal || 0
                    })
                })

                const topProducts = Object.values(productSales)
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 10)

                return {
                    title: 'Rapport des Produits',
                    period: `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`,
                    stats: [
                        { label: 'Total Produits', value: data.products.length },
                        { label: 'Produits vendus', value: Object.keys(productSales).length },
                        { label: 'Stock faible', value: data.products.filter(p => p.stock <= 10).length },
                        { label: 'Rupture', value: data.products.filter(p => p.stock === 0).length }
                    ],
                    chartData: topProducts.map(p => ({ name: p.name?.substring(0, 15) || 'N/A', value: p.revenue })),
                    tableData: topProducts.map((p, i) => ({
                        rang: i + 1,
                        produit: p.name,
                        quantité: p.quantity,
                        revenue: formatCurrency(p.revenue)
                    }))
                }

            case 'users':
                const vendeurs = data.users.filter(u => u.role === 'VENDEUR')
                return {
                    title: 'Rapport des Utilisateurs',
                    period: `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`,
                    stats: [
                        { label: 'Total Utilisateurs', value: data.users.length },
                        { label: 'Vendeurs', value: vendeurs.length },
                        { label: 'Analystes', value: data.users.filter(u => u.role === 'ANALYSTE').length },
                        { label: 'Utilisateurs actifs', value: data.users.filter(u => u.active).length }
                    ],
                    chartData: [
                        { name: 'Admin', value: data.users.filter(u => u.role === 'ADMIN').length },
                        { name: 'Vendeur', value: vendeurs.length },
                        { name: 'Analyste', value: data.users.filter(u => u.role === 'ANALYSTE').length },
                        { name: 'Investisseur', value: data.users.filter(u => u.role === 'INVESTISSEUR').length }
                    ],
                    tableData: data.users.map(u => ({
                        id: u.id,
                        nom: u.username,
                        email: u.email,
                        role: u.role,
                        statut: u.active ? 'Actif' : 'Inactif'
                    }))
                }

            case 'inventory':
                const categoryStock = {}
                data.products.forEach(p => {
                    const cat = p.categoryName || 'Autre'
                    if (!categoryStock[cat]) categoryStock[cat] = { total: 0, value: 0 }
                    categoryStock[cat].total += p.stock || 0
                    categoryStock[cat].value += (p.stock || 0) * (p.price || 0)
                })

                const totalStock = data.products.reduce((sum, p) => sum + (p.stock || 0), 0)
                const stockValue = data.products.reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0)

                return {
                    title: 'Rapport d\'Inventaire',
                    period: `Généré le ${formatDate(new Date())}`,
                    stats: [
                        { label: 'Total Unités', value: formatNumber(totalStock) },
                        { label: 'Valeur Stock', value: formatCurrency(stockValue) },
                        { label: 'Catégories', value: data.categories.length },
                        { label: 'Produits', value: data.products.length }
                    ],
                    chartData: Object.entries(categoryStock).map(([name, data]) => ({
                        name,
                        value: data.total
                    })),
                    tableData: data.products.slice(0, 20).map(p => ({
                        id: p.id,
                        produit: p.title,
                        catégorie: p.categoryName,
                        stock: p.stock,
                        prix: formatCurrency(p.price),
                        valeur: formatCurrency(p.stock * p.price)
                    }))
                }

            case 'performance':
                const vendeurPerf = data.users.filter(u => u.role === 'VENDEUR').map(v => {
                    const vendeurSales = filteredSales.filter(s => s.userId === v.id)
                    return {
                        id: v.id,
                        name: v.username,
                        sales: vendeurSales.length,
                        revenue: vendeurSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                    }
                }).sort((a, b) => b.revenue - a.revenue)

                return {
                    title: 'Performance des Vendeurs',
                    period: `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`,
                    stats: [
                        { label: 'Total Vendeurs', value: vendeurPerf.length },
                        { label: 'Total Ventes', value: vendeurPerf.reduce((sum, v) => sum + v.sales, 0) },
                        { label: 'CA Total', value: formatCurrency(vendeurPerf.reduce((sum, v) => sum + v.revenue, 0)) },
                        { label: 'Moy. par vendeur', value: formatCurrency(vendeurPerf.length > 0 ? vendeurPerf.reduce((sum, v) => sum + v.revenue, 0) / vendeurPerf.length : 0) }
                    ],
                    chartData: vendeurPerf.slice(0, 10).map(v => ({ name: v.name, value: v.revenue })),
                    tableData: vendeurPerf.map((v, i) => ({
                        rang: i + 1,
                        vendeur: v.name,
                        ventes: v.sales,
                        revenue: formatCurrency(v.revenue),
                        moyenne: formatCurrency(v.sales > 0 ? v.revenue / v.sales : 0)
                    }))
                }

            default:
                return null
        }
    }

    const handlePreview = (reportType) => {
        setSelectedReport(reportType)
        setShowPreview(true)
    }

    const handlePrint = () => {
        const printContent = printRef.current
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
            <html>
                <head>
                    <title>Rapport - ${selectedReport}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #1a1a1a; }
                        .stats { display: flex; gap: 20px; margin: 20px 0; }
                        .stat { background: #f5f5f5; padding: 15px; border-radius: 8px; }
                        .stat-label { color: #666; font-size: 14px; }
                        .stat-value { font-size: 24px; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background: #f5f5f5; }
                        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                    <div class="footer">Généré le ${new Date().toLocaleString('fr-FR')}</div>
                </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.print()
    }

    const handleExportCSV = () => {
        if (!selectedReport) return
        const reportData = generateReportData(selectedReport)
        if (!reportData?.tableData) return

        const headers = Object.keys(reportData.tableData[0] || {})
        const rows = reportData.tableData.map(row => headers.map(h => row[h]))
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rapport-${selectedReport}-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        toast.success('Export CSV généré')
    }

    const handleExportPDF = async () => {
        if (!selectedReport) return
        try {
            toast.loading('Génération du PDF...')
            let response;
            const filterRequest = {
                startDate: dateRange.start,
                endDate: dateRange.end
            }

            switch (selectedReport) {
                case 'sales':
                    response = await import('../../api').then(m => m.analyticsApi.exportSalesPDF(filterRequest));
                    break;
                case 'products':
                    response = await import('../../api').then(m => m.analyticsApi.exportProductsPDF(filterRequest));
                    break;
                case 'users':
                    response = await import('../../api').then(m => m.analyticsApi.exportUsersPDF());
                    break;
                case 'inventory':
                    response = await import('../../api').then(m => m.analyticsApi.exportInventoryPDF());
                    break;
                case 'performance': // Sellers
                    response = await import('../../api').then(m => m.analyticsApi.exportSellersPDF(filterRequest));
                    break;
                default:
                    toast.error("Type de rapport non supporté")
                    return;
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rapport-${selectedReport}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.dismiss();
            toast.success('PDF téléchargé avec succès');

        } catch (error) {
            console.error("Export PDF error", error);
            toast.dismiss();
            toast.error("Erreur lors de l'export PDF");
        }
    }

    if (loading) return <Loading />

    const reportData = selectedReport ? generateReportData(selectedReport) : null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-7 h-7 text-primary-500" />
                        Rapports
                    </h1>
                    <p className="text-dark-500">Générez et exportez des rapports détaillés</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualiser
                    </Button>
                </div>
            </div>

            {/* Date Range Filter */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-primary-500" />
                        </div>
                        <span className="text-sm font-medium text-dark-700 dark:text-dark-200">Période du rapport :</span>
                    </div>
                    <DateRangePicker
                        startDate={dateRange.start}
                        endDate={dateRange.end}
                        onStartDateChange={(val) => setDateRange(prev => ({ ...prev, start: val }))}
                        onEndDateChange={(val) => setDateRange(prev => ({ ...prev, end: val }))}
                    />
                </div>
            </Card>

            {/* Report Types Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {REPORT_TYPES.map((report, index) => {
                    const Icon = report.icon
                    const colors = {
                        primary: 'from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700',
                        success: 'from-success-500 to-emerald-600 hover:from-success-600 hover:to-emerald-700',
                        secondary: 'from-secondary-500 to-purple-600 hover:from-secondary-600 hover:to-purple-700',
                        warning: 'from-warning-500 to-orange-600 hover:from-warning-600 hover:to-orange-700',
                        danger: 'from-danger-500 to-red-600 hover:from-danger-600 hover:to-red-700'
                    }

                    return (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card
                                className={`p-6 cursor-pointer bg-gradient-to-br ${colors[report.color]} text-white transition-all hover:shadow-lg hover:-translate-y-1 block`}
                                onClick={() => handlePreview(report.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold tracking-tight">{report.title}</h3>
                                        <p className="text-white/80 text-sm mt-1 font-medium">Cliquez pour prévisualiser</p>
                                    </div>
                                    <div className="p-2 bg-white/10 rounded-full">
                                        <Eye className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            {/* Report Preview Modal */}
            <Modal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title={reportData?.title || 'Rapport'}
                size="xl"
            >
                {reportData && (
                    <div className="space-y-6">
                        {/* Actions */}
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-700">
                            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">{reportData.period}</Badge>
                            <div className="flex gap-3">
                                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    CSV
                                </Button>
                                <Button variant="primary" size="sm" onClick={handleExportPDF} loading={generating}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Télécharger PDF
                                </Button>
                            </div>
                        </div>

                        {/* Report Content */}
                        <div ref={printRef}>
                            {/* Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {reportData.stats.map((stat, i) => (
                                    <div key={i} className="p-5 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-sm font-medium text-dark-500 mb-1">{stat.label}</p>
                                        <p className="text-2xl font-bold text-dark-900 dark:text-white tracking-tight">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Chart */}
                            {reportData.chartData && reportData.chartData.length > 0 && (
                                <div className="mb-8 p-6 border border-gray-100 dark:border-dark-700 rounded-2xl bg-white dark:bg-dark-800 shadow-sm">
                                    <h3 className="text-lg font-semibold mb-6 text-dark-900 dark:text-white flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-primary-500" />
                                        Visualisation
                                    </h3>
                                    <div className="h-72">
                                        {selectedReport === 'users' || selectedReport === 'inventory' ? (
                                            <PieChartComponent data={reportData.chartData} />
                                        ) : (
                                            <BarChartComponent data={reportData.chartData} dataKey="value" />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Table */}
                            {reportData.tableData && reportData.tableData.length > 0 && (
                                <div className="border border-gray-200 dark:border-dark-700 rounded-xl overflow-hidden shadow-sm">
                                    <div className="max-h-[400px] overflow-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 dark:bg-dark-800/50 sticky top-0 z-10 backdrop-blur-sm">
                                                <tr>
                                                    {Object.keys(reportData.tableData[0]).map(key => (
                                                        <th key={key} className="px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                                                            {key}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-dark-700 bg-white dark:bg-dark-800">
                                                {reportData.tableData.map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                                                        {Object.values(row).map((val, j) => (
                                                            <td key={j} className="px-6 py-4 text-sm text-dark-700 dark:text-dark-300 whitespace-nowrap">
                                                                {val}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
