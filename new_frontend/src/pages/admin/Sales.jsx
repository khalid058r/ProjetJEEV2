import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Search, Edit2, Trash2, ShoppingCart, Calendar, User,
    Download, Filter, ArrowUpDown, Eye, X, XCircle, Package,
    TrendingUp, DollarSign, Check, Minus, Users, BarChart3,
    Receipt, CreditCard, Sparkles, Star, Clock, ArrowRight, Zap, SlidersHorizontal, ChevronDown
} from 'lucide-react'
import { saleApi, productApi, userApi, categoryApi } from '../../api'
import { Button, Card, Modal, Input, Badge, Loading, EmptyState, ConfirmDialog, SearchInput, Avatar, Pagination } from '../../components/ui'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function Sales() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [sales, setSales] = useState([])
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFilter, setDateFilter] = useState('')
    const [dateRangeStart, setDateRangeStart] = useState('')
    const [dateRangeEnd, setDateRangeEnd] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [vendeurFilter, setVendeurFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showVendeurStats, setShowVendeurStats] = useState(false)
    const [selectedSale, setSelectedSale] = useState(null)

    // Filtres avancés
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [amountMin, setAmountMin] = useState('')
    const [amountMax, setAmountMax] = useState('')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Enhanced cart for creative sale modal
    const [cartItems, setCartItems] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('')
    const [productSearchQuery, setProductSearchQuery] = useState('')
    const [selectedVendeur, setSelectedVendeur] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Vendeur Stats
    const [vendeurStats, setVendeurStats] = useState([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [salesRes, productsRes, usersRes, categoriesRes] = await Promise.all([
                saleApi.getAll().catch(() => ({ data: [] })),
                productApi.getAll().catch(() => ({ data: [] })),
                userApi.getAll().catch(() => ({ data: [] })),
                categoryApi.getAll().catch(() => ({ data: [] }))
            ])
            setSales(salesRes.data || [])
            setProducts(productsRes.data || [])
            setUsers(usersRes.data || [])
            setCategories(categoriesRes.data || [])

            // Calculate vendeur stats
            const vendeurs = (usersRes.data || []).filter(u => u.role === 'VENDEUR')
            const salesData = salesRes.data || []
            const stats = vendeurs.map(v => {
                const vendeurSales = salesData.filter(s => s.userId === v.id)
                const totalRevenue = vendeurSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
                return {
                    ...v,
                    salesCount: vendeurSales.length,
                    totalRevenue,
                    avgOrder: vendeurSales.length > 0 ? totalRevenue / vendeurSales.length : 0
                }
            }).sort((a, b) => b.totalRevenue - a.totalRevenue)
            setVendeurStats(stats)
        } catch (error) {
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch =
                sale.username?.toLowerCase().includes(searchLower) ||
                sale.lignes?.some(l => l.productTitle?.toLowerCase().includes(searchLower)) ||
                sale.id?.toString().includes(searchLower)

            let matchesDate = true
            if (dateFilter) {
                const saleDate = new Date(sale.saleDate).toISOString().split('T')[0]
                matchesDate = saleDate === dateFilter
            }
            if (dateRangeStart && dateRangeEnd) {
                const saleDate = new Date(sale.saleDate)
                matchesDate = saleDate >= new Date(dateRangeStart) && saleDate <= new Date(dateRangeEnd)
            }

            const matchesStatus = !statusFilter || sale.status === statusFilter
            const matchesVendeur = !vendeurFilter || sale.userId === parseInt(vendeurFilter)

            // Filtres avancés montant
            const matchesAmountMin = !amountMin || sale.totalAmount >= parseFloat(amountMin)
            const matchesAmountMax = !amountMax || sale.totalAmount <= parseFloat(amountMax)

            return matchesSearch && matchesDate && matchesStatus && matchesVendeur && matchesAmountMin && matchesAmountMax
        })
    }, [sales, searchQuery, dateFilter, dateRangeStart, dateRangeEnd, statusFilter, vendeurFilter, amountMin, amountMax])

    // Pagination
    const totalPages = Math.ceil(filteredSales.length / itemsPerPage)
    const paginatedSales = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredSales.slice(start, start + itemsPerPage)
    }, [filteredSales, currentPage, itemsPerPage])

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, dateFilter, dateRangeStart, dateRangeEnd, statusFilter, vendeurFilter, amountMin, amountMax])

    const totalRevenue = useMemo(() => {
        return filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
    }, [filteredSales])

    // Products filtered by category and search
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = !selectedCategory || p.categoryId === parseInt(selectedCategory)
            const matchesSearch = !productSearchQuery ||
                p.title?.toLowerCase().includes(productSearchQuery.toLowerCase())
            return matchesCategory && matchesSearch && p.stock > 0
        })
    }, [products, selectedCategory, productSearchQuery])

    const handleOpenModal = () => {
        setSelectedSale(null)
        setCartItems([])
        setSelectedCategory('')
        setProductSearchQuery('')
        setSelectedVendeur(user?.role === 'ADMIN' ? '' : user?.id?.toString() || '')
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setSelectedSale(null)
        setCartItems([])
    }

    const handleViewDetail = (sale) => {
        navigate(`/admin/sales/${sale.id}`)
    }

    const addToCart = (product) => {
        const existingItem = cartItems.find(item => item.productId === product.id)
        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                toast.error('Stock maximum atteint')
                return
            }
            setCartItems(cartItems.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ))
        } else {
            setCartItems([...cartItems, {
                productId: product.id,
                productTitle: product.title,
                price: product.price,
                quantity: 1,
                stock: product.stock,
                imageUrl: product.imageUrl
            }])
        }
        toast.success(`${product.title} ajouté`, { duration: 1000 })
    }

    const removeFromCart = (productId) => {
        setCartItems(cartItems.filter(item => item.productId !== productId))
    }

    const updateCartQuantity = (productId, delta) => {
        setCartItems(cartItems.map(item => {
            if (item.productId === productId) {
                const newQty = item.quantity + delta
                if (newQty <= 0) return null
                if (newQty > item.stock) {
                    toast.error('Stock insuffisant')
                    return item
                }
                return { ...item, quantity: newQty }
            }
            return item
        }).filter(Boolean))
    }

    const cartTotal = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }, [cartItems])

    const cartItemsCount = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.quantity, 0)
    }, [cartItems])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (cartItems.length === 0) {
            toast.error('Ajoutez au moins un produit')
            return
        }

        // Vérifier que l'utilisateur est connecté
        if (!user || !user.id) {
            toast.error('Erreur: Utilisateur non identifié. Veuillez vous reconnecter.')
            return
        }

        setSubmitting(true)

        try {
            // L'ID utilisateur est automatiquement celui de l'utilisateur connecté
            // Les headers X-User-Id et X-User-Role sont envoyés automatiquement par axios
            const saleData = {
                userId: user.id,
                lignes: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            }

            await saleApi.create(saleData)
            toast.success('🎉 Vente enregistrée avec succès!')

            fetchData()
            handleCloseModal()
        } catch (error) {
            console.error('Sale creation error:', error)
            toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedSale) return

        try {
            await saleApi.delete(selectedSale.id)
            toast.success('Vente supprimée')
            fetchData()
            setShowDeleteConfirm(false)
            setSelectedSale(null)
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    const handleCancel = async () => {
        if (!selectedSale) return

        try {
            await saleApi.cancel(selectedSale.id)
            toast.success('Vente annulée - Stock restauré')
            fetchData()
            setShowCancelConfirm(false)
            setSelectedSale(null)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation')
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'COMPLETED':
            case 'CONFIRMED':
                return <Badge variant="success"><Check className="w-3 h-3 mr-1" />Confirmée</Badge>
            case 'CANCELLED':
                return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" />Annulée</Badge>
            case 'PENDING':
            default:
                return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />En attente</Badge>
        }
    }

    const clearFilters = () => {
        setSearchQuery('')
        setDateFilter('')
        setDateRangeStart('')
        setDateRangeEnd('')
        setStatusFilter('')
        setVendeurFilter('')
        setAmountMin('')
        setAmountMax('')
    }

    if (loading) return <Loading />

    const vendeurs = users.filter(u => u.role === 'VENDEUR')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="w-7 h-7 text-primary-500" />
                        Gestion des Ventes
                    </h1>
                    <p className="text-dark-500">{sales.length} ventes enregistrées</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setShowVendeurStats(true)}>
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Stats Vendeurs
                    </Button>
                    <Button variant="outline" onClick={() => toast.success('Export en cours...')}>
                        <Download className="w-5 h-5 mr-2" />
                        Exporter
                    </Button>
                    <Button onClick={handleOpenModal} className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600">
                        <Zap className="w-5 h-5 mr-2" />
                        Nouvelle Vente
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-primary-100 text-sm">Total Ventes</p>
                            <p className="text-3xl font-bold">{filteredSales.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Receipt className="w-6 h-6" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-success-500 to-emerald-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-success-100 text-sm">Chiffre d'affaires</p>
                            <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-secondary-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-secondary-100 text-sm">Panier moyen</p>
                            <p className="text-3xl font-bold">
                                {formatCurrency(filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-warning-500 to-orange-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-warning-100 text-sm">Vendeurs actifs</p>
                            <p className="text-3xl font-bold">{vendeurs.filter(v => v.active).length}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Rechercher par ID, produit ou vendeur..."
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={vendeurFilter}
                            onChange={(e) => setVendeurFilter(e.target.value)}
                            className="px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Tous les vendeurs</option>
                            {vendeurs.map(v => (
                                <option key={v.id} value={v.id}>{v.username}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Tous statuts</option>
                            <option value="CONFIRMED">Confirmées</option>
                            <option value="PENDING">En attente</option>
                            <option value="CANCELLED">Annulées</option>
                        </select>
                        <input
                            type="date"
                            value={dateRangeStart}
                            onChange={(e) => setDateRangeStart(e.target.value)}
                            className="px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Date début"
                        />
                        <input
                            type="date"
                            value={dateRangeEnd}
                            onChange={(e) => setDateRangeEnd(e.target.value)}
                            className="px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Date fin"
                        />
                        {(searchQuery || vendeurFilter || statusFilter || dateRangeStart || dateRangeEnd || amountMin || amountMax) && (
                            <Button variant="ghost" onClick={clearFilters} size="sm">
                                <X className="w-4 h-4 mr-1" />
                                Effacer
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            size="sm"
                        >
                            <SlidersHorizontal className="w-4 h-4 mr-1" />
                            Plus
                            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Filtres avancés */}
                <AnimatePresence>
                    {showAdvancedFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-4 border-t border-gray-200 dark:border-dark-700">
                                <div>
                                    <label className="block text-xs font-medium text-dark-500 mb-1">Montant min (DH)</label>
                                    <input
                                        type="number"
                                        value={amountMin}
                                        onChange={(e) => setAmountMin(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-dark-500 mb-1">Montant max (DH)</label>
                                    <input
                                        type="number"
                                        value={amountMax}
                                        onChange={(e) => setAmountMax(e.target.value)}
                                        placeholder="∞"
                                        className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Results count */}
            <div className="text-sm text-dark-500">
                {filteredSales.length} vente(s) trouvée(s)
            </div>

            {/* Sales Table */}
            {paginatedSales.length > 0 ? (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-50 dark:bg-dark-800/50">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">ID</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Produits</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Total</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Date</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Vendeur</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Statut</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-dark-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                                <AnimatePresence>
                                    {paginatedSales.map((sale, index) => (
                                        <motion.tr
                                            key={sale.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="hover:bg-dark-50 dark:hover:bg-dark-800/50"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-dark-900 dark:text-white">
                                                    #{sale.id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center">
                                                        <ShoppingCart className="w-5 h-5 text-primary-600" />
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-dark-900 dark:text-white">
                                                            {sale.lignes?.length || 0} article(s)
                                                        </span>
                                                        <p className="text-xs text-dark-400 truncate max-w-[200px]">
                                                            {sale.lignes?.map(l => l.productTitle).join(', ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-success-600 text-lg">
                                                {formatCurrency(sale.totalAmount || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-dark-500 text-sm">
                                                {formatDate(sale.saleDate)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Avatar name={sale.username} size="sm" />
                                                    <span className="text-dark-600 dark:text-dark-400">{sale.username || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(sale.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleViewDetail(sale)}
                                                        className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                                                        title="Voir détails"
                                                    >
                                                        <Eye className="w-4 h-4 text-dark-500" />
                                                    </button>
                                                    {sale.status !== 'CANCELLED' && (
                                                        <button
                                                            onClick={() => { setSelectedSale(sale); setShowCancelConfirm(true) }}
                                                            className="p-2 hover:bg-warning-50 dark:hover:bg-warning-900/20 rounded-lg transition-colors"
                                                            title="Annuler"
                                                        >
                                                            <XCircle className="w-4 h-4 text-warning-500" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => { setSelectedSale(sale); setShowDeleteConfirm(true) }}
                                                        className="p-2 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-danger-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <EmptyState
                    icon={ShoppingCart}
                    title="Aucune vente trouvée"
                    description="Enregistrez votre première vente"
                    action={
                        <Button onClick={handleOpenModal}>
                            <Plus className="w-5 h-5 mr-2" />
                            Nouvelle vente
                        </Button>
                    }
                />
            )}

            {/* Pagination */}
            {filteredSales.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                    totalItems={filteredSales.length}
                />
            )}

            {/* ========== CREATIVE SALE MODAL ========== */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title=""
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-0">
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-primary-500 to-secondary-500 -mx-6 -mt-6 px-6 py-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Nouvelle Vente</h2>
                                    <p className="text-white/70 text-sm">Créez une vente en quelques clics</p>
                                </div>
                            </div>
                            {cartItems.length > 0 && (
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                                    <p className="text-white/70 text-xs">Total</p>
                                    <p className="text-white font-bold text-xl">{formatCurrency(cartTotal)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
                        {/* Left: Product Selection */}
                        <div className="space-y-4">
                            {/* Affichage du responsable de la vente (utilisateur connecté) */}
                            <div className="p-4 bg-gradient-to-r from-primary-50 to-success-50 dark:from-primary-900/20 dark:to-success-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-xs text-dark-500 dark:text-dark-400">Responsable de la vente</p>
                                        <p className="font-semibold text-dark-800 dark:text-dark-200">{user?.username || 'Utilisateur'}</p>
                                        <p className="text-xs text-primary-600 dark:text-primary-400">{user?.role}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                    Filtrer par catégorie
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCategory('')}
                                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${!selectedCategory
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600'
                                            }`}
                                    >
                                        Tous
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id.toString())}
                                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedCategory === cat.id.toString()
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Product Search */}
                            <div>
                                <input
                                    type="text"
                                    value={productSearchQuery}
                                    onChange={(e) => setProductSearchQuery(e.target.value)}
                                    placeholder="🔍 Rechercher un produit..."
                                    className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Products Grid */}
                            <div className="h-[300px] overflow-y-auto space-y-2 pr-2">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map(product => {
                                        const inCart = cartItems.find(item => item.productId === product.id)
                                        return (
                                            <motion.div
                                                key={product.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${inCart
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                    : 'border-gray-200 dark:border-dark-700 hover:border-primary-300 hover:bg-dark-50 dark:hover:bg-dark-800'
                                                    }`}
                                                onClick={() => addToCart(product)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center overflow-hidden">
                                                        {product.imageUrl ? (
                                                            <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-6 h-6 text-primary-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-dark-900 dark:text-white truncate">{product.title}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-success-600 font-bold">{formatCurrency(product.price)}</span>
                                                            <span className="text-xs text-dark-400">Stock: {product.stock}</span>
                                                        </div>
                                                    </div>
                                                    {inCart ? (
                                                        <Badge variant="primary" className="flex items-center gap-1">
                                                            <Check className="w-3 h-3" />
                                                            {inCart.quantity}
                                                        </Badge>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )
                                    })
                                ) : (
                                    <div className="h-full flex items-center justify-center text-dark-500">
                                        Aucun produit disponible
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Cart */}
                        <div className="bg-dark-50 dark:bg-dark-800/50 rounded-2xl p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-primary-500" />
                                    Panier
                                </h3>
                                <Badge variant="primary">{cartItemsCount} articles</Badge>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto space-y-3 max-h-[280px]">
                                <AnimatePresence>
                                    {cartItems.length > 0 ? (
                                        cartItems.map(item => (
                                            <motion.div
                                                key={item.productId}
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="p-3 bg-white dark:bg-dark-800 rounded-xl shadow-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center overflow-hidden">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-5 h-5 text-primary-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-dark-900 dark:text-white text-sm truncate">{item.productTitle}</p>
                                                        <p className="text-xs text-dark-500">{formatCurrency(item.price)} /u</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCartQuantity(item.productId, -1)}
                                                            className="w-7 h-7 rounded-lg bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600 flex items-center justify-center transition-colors"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-8 text-center font-bold text-dark-900 dark:text-white">{item.quantity}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCartQuantity(item.productId, 1)}
                                                            className="w-7 h-7 rounded-lg bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600 flex items-center justify-center transition-colors"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="text-right ml-2">
                                                        <p className="font-bold text-success-600">{formatCurrency(item.price * item.quantity)}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(item.productId)}
                                                            className="text-xs text-danger-500 hover:underline"
                                                        >
                                                            Retirer
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-dark-400 py-8">
                                            <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
                                            <p>Votre panier est vide</p>
                                            <p className="text-sm">Cliquez sur un produit pour l'ajouter</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Cart Total & Submit */}
                            {cartItems.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-dark-600 dark:text-dark-400">Sous-total</span>
                                        <span className="font-medium text-dark-900 dark:text-white">{formatCurrency(cartTotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-lg">
                                        <span className="font-bold text-dark-900 dark:text-white">Total</span>
                                        <span className="font-bold text-2xl text-success-600">{formatCurrency(cartTotal)}</span>
                                    </div>
                                    <Button
                                        type="submit"
                                        loading={submitting}
                                        disabled={cartItems.length === 0}
                                        className="w-full bg-gradient-to-r from-success-500 to-emerald-600 hover:from-success-600 hover:to-emerald-700 py-3"
                                    >
                                        <CreditCard className="w-5 h-5 mr-2" />
                                        Finaliser la vente
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`Détails de la vente #${selectedSale?.id}`}
                size="lg"
            >
                {selectedSale && (
                    <div className="space-y-4">
                        {/* Sale Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                <p className="text-sm text-dark-500 mb-1">Date</p>
                                <p className="font-medium text-dark-900 dark:text-white">
                                    {formatDateTime(selectedSale.saleDate)}
                                </p>
                            </div>
                            <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                <p className="text-sm text-dark-500 mb-1">Vendeur</p>
                                <div className="flex items-center gap-2">
                                    <Avatar name={selectedSale.username} size="sm" />
                                    <span className="font-medium text-dark-900 dark:text-white">{selectedSale.username || '-'}</span>
                                </div>
                            </div>
                            <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                <p className="text-sm text-dark-500 mb-1">Statut</p>
                                {getStatusBadge(selectedSale.status)}
                            </div>
                            <div className="p-4 bg-gradient-to-br from-success-500 to-emerald-600 rounded-xl text-white">
                                <p className="text-success-100 text-sm mb-1">Total</p>
                                <p className="font-bold text-2xl">{formatCurrency(selectedSale.totalAmount)}</p>
                            </div>
                        </div>

                        {/* Sale Lines */}
                        <div>
                            <h4 className="font-medium text-dark-900 dark:text-white mb-3">Articles ({selectedSale.lignes?.length || 0})</h4>
                            <div className="space-y-2">
                                {selectedSale.lignes?.map((ligne, index) => (
                                    <div
                                        key={ligne.id || index}
                                        className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-800 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center">
                                                <Package className="w-5 h-5 text-primary-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-dark-900 dark:text-white">{ligne.productTitle}</p>
                                                <p className="text-sm text-dark-500">
                                                    {formatCurrency(ligne.unitPrice)} × {ligne.quantity}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-success-600 text-lg">
                                            {formatCurrency(ligne.lineTotal)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Vendeur Stats Modal */}
            <Modal
                isOpen={showVendeurStats}
                onClose={() => setShowVendeurStats(false)}
                title="Statistiques des Vendeurs"
                size="lg"
            >
                <div className="space-y-4">
                    <p className="text-dark-500 text-sm">Performance de vos vendeurs classée par chiffre d'affaires</p>
                    <div className="space-y-3">
                        {vendeurStats.map((vendeur, index) => (
                            <div
                                key={vendeur.id}
                                className={`p-4 rounded-xl border-2 ${index === 0 ? 'border-warning-500 bg-warning-50 dark:bg-warning-900/20' :
                                    index === 1 ? 'border-gray-400 bg-gray-50 dark:bg-gray-900/20' :
                                        index === 2 ? 'border-amber-700 bg-amber-50 dark:bg-amber-900/20' :
                                            'border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${index === 0 ? 'bg-warning-500 text-white' :
                                        index === 1 ? 'bg-gray-400 text-white' :
                                            index === 2 ? 'bg-amber-700 text-white' :
                                                'bg-dark-200 dark:bg-dark-700 text-dark-600'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <Avatar name={vendeur.username} size="md" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-dark-900 dark:text-white">{vendeur.username}</p>
                                        <p className="text-sm text-dark-500">{vendeur.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-success-600">{formatCurrency(vendeur.totalRevenue)}</p>
                                        <div className="flex items-center gap-4 text-sm text-dark-500">
                                            <span>{vendeur.salesCount} ventes</span>
                                            <span>Moy: {formatCurrency(vendeur.avgOrder)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {vendeurStats.length === 0 && (
                            <div className="text-center py-8 text-dark-500">
                                Aucun vendeur enregistré
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Supprimer la vente"
                message="Êtes-vous sûr de vouloir supprimer cette vente ? Cette action est irréversible."
                confirmText="Supprimer"
                variant="danger"
            />

            {/* Cancel Confirmation */}
            <ConfirmDialog
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={handleCancel}
                title="Annuler la vente"
                message={`Êtes-vous sûr de vouloir annuler la vente #${selectedSale?.id} ? Le stock des produits sera restauré.`}
                confirmText="Annuler la vente"
                variant="warning"
            />
        </div>
    )
}
