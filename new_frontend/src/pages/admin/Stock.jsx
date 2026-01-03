import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Package, AlertTriangle, TrendingUp, TrendingDown, RefreshCw,
    Plus, Edit2, Search, Filter, BarChart3, ArrowUpRight, ArrowDownRight,
    CheckCircle2, XCircle, Clock, Truck, Warehouse, Activity
} from 'lucide-react'
import { stockApi, productApi } from '../../api'
import { Card, Button, Badge, Loading, Modal, Input } from '../../components/ui'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function StockDashboard() {
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [dashboard, setDashboard] = useState(null)
    const [lowStockProducts, setLowStockProducts] = useState([])
    const [outOfStockProducts, setOutOfStockProducts] = useState([])

    // Modals
    const [showAddStockModal, setShowAddStockModal] = useState(false)
    const [showAdjustStockModal, setShowAdjustStockModal] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)

    // Form data
    const [addStockForm, setAddStockForm] = useState({
        quantity: '',
        supplier: '',
        notes: ''
    })
    const [adjustStockForm, setAdjustStockForm] = useState({
        newQuantity: '',
        reason: ''
    })

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [stockFilter, setStockFilter] = useState('all') // all, low, out, ok
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [productsRes, lowStockRes, outOfStockRes] = await Promise.all([
                productApi.getAll(),
                stockApi.getLowStockProducts().catch(() => ({ data: [] })),
                stockApi.getOutOfStockProducts().catch(() => ({ data: [] }))
            ])

            setProducts(productsRes.data || [])
            setLowStockProducts(lowStockRes.data || [])
            setOutOfStockProducts(outOfStockRes.data || [])

            // Calculer le dashboard localement si l'API n'est pas disponible
            const allProducts = productsRes.data || []
            setDashboard({
                totalProducts: allProducts.length,
                totalStock: allProducts.reduce((sum, p) => sum + (p.stock || 0), 0),
                totalReserved: allProducts.reduce((sum, p) => sum + (p.reservedStock || 0), 0),
                totalAvailable: allProducts.reduce((sum, p) => sum + Math.max(0, (p.stock || 0) - (p.reservedStock || 0)), 0),
                lowStockCount: allProducts.filter(p => {
                    const available = (p.stock || 0) - (p.reservedStock || 0)
                    return available > 0 && available <= 10
                }).length,
                outOfStockCount: allProducts.filter(p => {
                    const available = (p.stock || 0) - (p.reservedStock || 0)
                    return available <= 0
                }).length,
                stockValue: allProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0)
            })
        } catch (error) {
            console.error('Error fetching stock data:', error)
            toast.error('Erreur lors du chargement des données')
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch =
                product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.asin?.toLowerCase().includes(searchQuery.toLowerCase())

            const available = (product.stock || 0) - (product.reservedStock || 0)
            let matchesFilter = true

            if (stockFilter === 'out') matchesFilter = available <= 0
            else if (stockFilter === 'low') matchesFilter = available > 0 && available <= 10
            else if (stockFilter === 'ok') matchesFilter = available > 10

            return matchesSearch && matchesFilter
        })
    }, [products, searchQuery, stockFilter])

    const openAddStockModal = (product) => {
        setSelectedProduct(product)
        setAddStockForm({ quantity: '', supplier: '', notes: '' })
        setShowAddStockModal(true)
    }

    const openAdjustStockModal = (product) => {
        setSelectedProduct(product)
        setAdjustStockForm({
            newQuantity: product.stock?.toString() || '0',
            reason: ''
        })
        setShowAdjustStockModal(true)
    }

    const handleAddStock = async (e) => {
        e.preventDefault()
        if (!selectedProduct || !addStockForm.quantity) return

        setSubmitting(true)
        try {
            await stockApi.addStock(
                selectedProduct.id,
                parseInt(addStockForm.quantity),
                addStockForm.supplier,
                addStockForm.notes
            )
            toast.success(`+${addStockForm.quantity} unités ajoutées à ${selectedProduct.title}`)
            setShowAddStockModal(false)
            fetchData()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout de stock')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAdjustStock = async (e) => {
        e.preventDefault()
        if (!selectedProduct || adjustStockForm.newQuantity === '') return

        setSubmitting(true)
        try {
            await stockApi.adjustStock(
                selectedProduct.id,
                parseInt(adjustStockForm.newQuantity),
                adjustStockForm.reason
            )
            const diff = parseInt(adjustStockForm.newQuantity) - (selectedProduct.stock || 0)
            toast.success(`Stock ajusté: ${diff >= 0 ? '+' : ''}${diff} (${adjustStockForm.newQuantity} total)`)
            setShowAdjustStockModal(false)
            fetchData()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'ajustement')
        } finally {
            setSubmitting(false)
        }
    }

    const getStockBadge = (product) => {
        const available = (product.stock || 0) - (product.reservedStock || 0)

        if (available <= 0) {
            return <Badge variant="danger">Rupture</Badge>
        } else if (available <= 10) {
            return <Badge variant="warning">Stock bas</Badge>
        }
        return <Badge variant="success">En stock</Badge>
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                        <Warehouse className="w-7 h-7 text-primary-500" />
                        Gestion du Stock
                    </h1>
                    <p className="text-dark-500 mt-1">
                        Tableau de bord et gestion des inventaires
                    </p>
                </div>
                <Button onClick={fetchData} variant="outline" icon={RefreshCw}>
                    Actualiser
                </Button>
            </div>

            {/* KPI Cards */}
            {dashboard && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stock Total */}
                    <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-white/80">Stock Total</p>
                                <p className="text-3xl font-bold">{formatNumber(dashboard.totalStock)}</p>
                            </div>
                            <Package className="w-10 h-10 text-white/50" />
                        </div>
                    </Card>

                    {/* Stock Réservé */}
                    <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-white/80">Réservé</p>
                                <p className="text-3xl font-bold">{formatNumber(dashboard.totalReserved)}</p>
                            </div>
                            <Clock className="w-10 h-10 text-white/50" />
                        </div>
                    </Card>

                    {/* Stock Disponible */}
                    <Card className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-white/80">Disponible</p>
                                <p className="text-3xl font-bold">{formatNumber(dashboard.totalAvailable)}</p>
                            </div>
                            <CheckCircle2 className="w-10 h-10 text-white/50" />
                        </div>
                    </Card>

                    {/* Valeur Stock */}
                    <Card className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-white/80">Valeur Stock</p>
                                <p className="text-2xl font-bold">{formatCurrency(dashboard.stockValue)}</p>
                            </div>
                            <BarChart3 className="w-10 h-10 text-white/50" />
                        </div>
                    </Card>
                </div>
            )}

            {/* Alertes Stock */}
            {(dashboard?.lowStockCount > 0 || dashboard?.outOfStockCount > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Alertes Stock Bas */}
                    {dashboard?.lowStockCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-amber-800 dark:text-amber-200">
                                            {dashboard.lowStockCount} produit(s) en stock bas
                                        </p>
                                        <p className="text-sm text-amber-600 dark:text-amber-400">
                                            Moins de 10 unités disponibles
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Alertes Rupture */}
                    {dashboard?.outOfStockCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="p-4 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-red-800 dark:text-red-200">
                                            {dashboard.outOfStockCount} produit(s) en rupture
                                        </p>
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            Réapprovisionnement urgent requis
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Filtres et Recherche */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="px-4 py-2.5 bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl"
                    >
                        <option value="all">Tous les produits</option>
                        <option value="ok">✅ En stock (10+)</option>
                        <option value="low">⚠️ Stock bas (1-10)</option>
                        <option value="out">❌ Rupture (0)</option>
                    </select>
                </div>
            </Card>

            {/* Liste des Produits */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-50 dark:bg-dark-800">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 dark:text-dark-400 uppercase">
                                    Produit
                                </th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-600 dark:text-dark-400 uppercase">
                                    Stock Total
                                </th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-600 dark:text-dark-400 uppercase">
                                    Réservé
                                </th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-600 dark:text-dark-400 uppercase">
                                    Disponible
                                </th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-600 dark:text-dark-400 uppercase">
                                    Statut
                                </th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-600 dark:text-dark-400 uppercase">
                                    Prix
                                </th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-600 dark:text-dark-400 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-200 dark:divide-dark-700">
                            <AnimatePresence>
                                {filteredProducts.map((product, index) => {
                                    const available = (product.stock || 0) - (product.reservedStock || 0)

                                    return (
                                        <motion.tr
                                            key={product.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="hover:bg-dark-50 dark:hover:bg-dark-800/50"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt=""
                                                            className="w-10 h-10 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-dark-200 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-dark-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-dark-900 dark:text-white line-clamp-1">
                                                            {product.title}
                                                        </p>
                                                        <p className="text-xs text-dark-500">
                                                            {product.asin}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="font-semibold text-dark-900 dark:text-white">
                                                    {product.stock || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-medium ${(product.reservedStock || 0) > 0
                                                        ? 'text-amber-600'
                                                        : 'text-dark-500'
                                                    }`}>
                                                    {product.reservedStock || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${available <= 0
                                                        ? 'text-red-600'
                                                        : available <= 10
                                                            ? 'text-amber-600'
                                                            : 'text-emerald-600'
                                                    }`}>
                                                    {available}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStockBadge(product)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-dark-600 dark:text-dark-400">
                                                    {formatCurrency(product.price)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        icon={Plus}
                                                        onClick={() => openAddStockModal(product)}
                                                    >
                                                        Ajouter
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        icon={Edit2}
                                                        onClick={() => openAdjustStockModal(product)}
                                                    >
                                                        Ajuster
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="p-12 text-center">
                        <Package className="w-12 h-12 mx-auto mb-4 text-dark-400" />
                        <p className="text-dark-600 dark:text-dark-400">
                            Aucun produit trouvé
                        </p>
                    </div>
                )}
            </Card>

            {/* Modal Ajouter Stock */}
            <Modal
                isOpen={showAddStockModal}
                onClose={() => setShowAddStockModal(false)}
                title={`Ajouter du stock - ${selectedProduct?.title}`}
            >
                <form onSubmit={handleAddStock} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                            Stock actuel
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-dark-100 dark:bg-dark-800 rounded-lg">
                            <Package className="w-5 h-5 text-dark-500" />
                            <span className="font-semibold">{selectedProduct?.stock || 0}</span>
                            {(selectedProduct?.reservedStock || 0) > 0 && (
                                <span className="text-amber-600 text-sm">
                                    ({selectedProduct?.reservedStock} réservé)
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                            Quantité à ajouter *
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={addStockForm.quantity}
                            onChange={(e) => setAddStockForm(prev => ({ ...prev, quantity: e.target.value }))}
                            className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                            placeholder="Ex: 50"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                            Fournisseur
                        </label>
                        <input
                            type="text"
                            value={addStockForm.supplier}
                            onChange={(e) => setAddStockForm(prev => ({ ...prev, supplier: e.target.value }))}
                            className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                            placeholder="Nom du fournisseur"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={addStockForm.notes}
                            onChange={(e) => setAddStockForm(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                            placeholder="Notes additionnelles..."
                            rows={2}
                        />
                    </div>

                    {addStockForm.quantity && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <p className="text-emerald-700 dark:text-emerald-300">
                                Nouveau stock: <span className="font-bold">
                                    {(selectedProduct?.stock || 0) + parseInt(addStockForm.quantity || 0)}
                                </span>
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            variant="success"
                            className="flex-1"
                            icon={Plus}
                            loading={submitting}
                        >
                            Ajouter le stock
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAddStockModal(false)}
                        >
                            Annuler
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Ajuster Stock */}
            <Modal
                isOpen={showAdjustStockModal}
                onClose={() => setShowAdjustStockModal(false)}
                title={`Ajuster le stock - ${selectedProduct?.title}`}
            >
                <form onSubmit={handleAdjustStock} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                            Stock actuel
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-dark-100 dark:bg-dark-800 rounded-lg">
                            <Package className="w-5 h-5 text-dark-500" />
                            <span className="font-semibold">{selectedProduct?.stock || 0}</span>
                            {(selectedProduct?.reservedStock || 0) > 0 && (
                                <span className="text-amber-600 text-sm">
                                    ({selectedProduct?.reservedStock} réservé - ne peut pas être réduit en dessous)
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                            Nouvelle quantité *
                        </label>
                        <input
                            type="number"
                            min={selectedProduct?.reservedStock || 0}
                            value={adjustStockForm.newQuantity}
                            onChange={(e) => setAdjustStockForm(prev => ({ ...prev, newQuantity: e.target.value }))}
                            className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                            required
                        />
                        <p className="text-xs text-dark-500 mt-1">
                            Minimum: {selectedProduct?.reservedStock || 0} (stock réservé)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                            Raison de l'ajustement *
                        </label>
                        <select
                            value={adjustStockForm.reason}
                            onChange={(e) => setAdjustStockForm(prev => ({ ...prev, reason: e.target.value }))}
                            className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                            required
                        >
                            <option value="">Sélectionner une raison</option>
                            <option value="Inventaire physique">Inventaire physique</option>
                            <option value="Correction d'erreur">Correction d'erreur</option>
                            <option value="Produit endommagé">Produit endommagé</option>
                            <option value="Produit périmé">Produit périmé</option>
                            <option value="Perte/Vol">Perte/Vol</option>
                            <option value="Retour fournisseur">Retour fournisseur</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>

                    {adjustStockForm.newQuantity !== '' && (
                        <div className={`p-3 rounded-lg ${parseInt(adjustStockForm.newQuantity) > (selectedProduct?.stock || 0)
                                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                : parseInt(adjustStockForm.newQuantity) < (selectedProduct?.stock || 0)
                                    ? 'bg-red-50 dark:bg-red-900/20'
                                    : 'bg-gray-50 dark:bg-gray-800'
                            }`}>
                            <div className="flex items-center gap-2">
                                {parseInt(adjustStockForm.newQuantity) > (selectedProduct?.stock || 0) ? (
                                    <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                                ) : parseInt(adjustStockForm.newQuantity) < (selectedProduct?.stock || 0) ? (
                                    <ArrowDownRight className="w-5 h-5 text-red-600" />
                                ) : (
                                    <Activity className="w-5 h-5 text-gray-600" />
                                )}
                                <p className={`${parseInt(adjustStockForm.newQuantity) > (selectedProduct?.stock || 0)
                                        ? 'text-emerald-700 dark:text-emerald-300'
                                        : parseInt(adjustStockForm.newQuantity) < (selectedProduct?.stock || 0)
                                            ? 'text-red-700 dark:text-red-300'
                                            : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                    Différence: <span className="font-bold">
                                        {parseInt(adjustStockForm.newQuantity) - (selectedProduct?.stock || 0) >= 0 ? '+' : ''}
                                        {parseInt(adjustStockForm.newQuantity) - (selectedProduct?.stock || 0)}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            icon={Edit2}
                            loading={submitting}
                        >
                            Ajuster le stock
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAdjustStockModal(false)}
                        >
                            Annuler
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
