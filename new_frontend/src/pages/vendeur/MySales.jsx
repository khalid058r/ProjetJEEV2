import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    ShoppingCart, Calendar, Download, Eye, Search, Filter
} from 'lucide-react'
import { saleApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { Card, Loading, EmptyState, Modal, SearchInput, Badge, Button } from '../../components/ui'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function MySales() {
    const { user } = useAuth()
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFilter, setDateFilter] = useState('')
    const [selectedSale, setSelectedSale] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)

    useEffect(() => {
        fetchSales()
    }, [])

    const fetchSales = async () => {
        try {
            setLoading(true)
            const response = await saleApi.getAll().catch(() => ({ data: [] }))
            const allSales = response.data || []

            // Filter by current user
            const mySales = allSales.filter(sale =>
                !user?.id || sale.userId === user.id
            )

            setSales(mySales)
        } catch (error) {
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const filteredSales = sales.filter(sale => {
        const matchesSearch = sale.lignes?.some(l =>
            l.productTitle?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        let matchesDate = true
        if (dateFilter) {
            const saleDate = new Date(sale.saleDate).toISOString().split('T')[0]
            matchesDate = saleDate === dateFilter
        }
        return (searchQuery === '' || matchesSearch) && matchesDate
    })

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)

    const handleViewDetail = (sale) => {
        setSelectedSale(sale)
        setShowDetailModal(true)
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-success-500 to-emerald-600 text-white">
                    <p className="text-sm text-white/80">Total des ventes</p>
                    <p className="text-3xl font-bold">{filteredSales.length}</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-primary-500 to-secondary-600 text-white">
                    <p className="text-sm text-white/80">Chiffre d'affaires</p>
                    <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-warning-500 to-amber-600 text-white">
                    <p className="text-sm text-white/80">Panier moyen</p>
                    <p className="text-3xl font-bold">
                        {formatCurrency(filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0)}
                    </p>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Rechercher par produit..."
                        />
                    </div>
                    <div className="sm:w-48">
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <Button variant="outline" onClick={() => toast.success('Export en cours...')}>
                        <Download className="w-5 h-5 mr-2" />
                        Exporter
                    </Button>
                </div>
            </Card>

            {/* Sales List */}
            {filteredSales.length > 0 ? (
                <div className="space-y-3">
                    {filteredSales.map((sale, index) => (
                        <motion.div
                            key={sale.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="p-4 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                                            <ShoppingCart className="w-6 h-6 text-success-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-dark-900 dark:text-white">
                                                Vente #{sale.id}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-dark-500">
                                                <span>{sale.lignes?.length || 0} article(s)</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(sale.saleDate)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-success-600">
                                                {formatCurrency(sale.totalAmount)}
                                            </p>
                                            <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'warning'}>
                                                {sale.status || 'PENDING'}
                                            </Badge>
                                        </div>
                                        <button
                                            onClick={() => handleViewDetail(sale)}
                                            className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                                        >
                                            <Eye className="w-5 h-5 text-dark-500" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={ShoppingCart}
                    title="Aucune vente trouvée"
                    description="Vos ventes apparaîtront ici"
                />
            )}

            {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`Détails de la vente #${selectedSale?.id}`}
                size="lg"
            >
                {selectedSale && (
                    <div className="space-y-4">
                        <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-xl text-center">
                            <p className="text-sm text-success-600 dark:text-success-400">Montant Total</p>
                            <p className="text-3xl font-bold text-success-700 dark:text-success-300">
                                {formatCurrency(selectedSale.totalAmount)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-dark-500">Date</p>
                                <p className="font-medium text-dark-900 dark:text-white">
                                    {formatDateTime(selectedSale.saleDate)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-dark-500">Statut</p>
                                <Badge variant={selectedSale.status === 'COMPLETED' ? 'success' : 'warning'}>
                                    {selectedSale.status || 'PENDING'}
                                </Badge>
                            </div>
                        </div>

                        {/* Sale Lines */}
                        <div>
                            <h4 className="font-medium text-dark-900 dark:text-white mb-2">Articles</h4>
                            <div className="space-y-2">
                                {selectedSale.lignes?.map((ligne, index) => (
                                    <div
                                        key={ligne.id || index}
                                        className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-800 rounded-xl"
                                    >
                                        <div>
                                            <p className="font-medium text-dark-900 dark:text-white">{ligne.productTitle}</p>
                                            <p className="text-sm text-dark-500">
                                                {formatCurrency(ligne.unitPrice)} × {ligne.quantity}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-dark-900 dark:text-white">
                                            {formatCurrency(ligne.lineTotal)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
