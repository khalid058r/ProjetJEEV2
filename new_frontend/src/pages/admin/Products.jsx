import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye,
    Package, AlertTriangle, Upload, X, Image as ImageIcon, Star, RefreshCw,
    SlidersHorizontal, ChevronDown, TrendingUp, TrendingDown, DollarSign,
    ShoppingCart, BarChart3, Layers, AlertCircle, CheckCircle, FileText, Cloud, Check
} from 'lucide-react'
import { productApi, categoryApi, saleApi } from '../../api'
import { Button, Card, Modal, Input, Badge, Loading, EmptyState, ConfirmDialog, SearchInput, ImageUpload, Pagination } from '../../components/ui'
import { formatCurrency, getStockStatus, formatNumber } from '../../utils/formatters'
import { uploadToCloudinary, getOptimizedImageUrl } from '../../utils/cloudinary'
import toast from 'react-hot-toast'

export default function Products() {
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showStockModal, setShowStockModal] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [newStock, setNewStock] = useState('')
    const [updatingStock, setUpdatingStock] = useState(false)

    // Filtres avancés
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [priceMin, setPriceMin] = useState('')
    const [priceMax, setPriceMax] = useState('')
    const [stockFilter, setStockFilter] = useState('')
    const [ratingFilter, setRatingFilter] = useState('')
    const [sortBy, setSortBy] = useState('title')
    const [sortOrder, setSortOrder] = useState('asc')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(12)

    const [formData, setFormData] = useState({
        asin: '',
        title: '',
        price: '',
        stock: '',
        categoryId: '',
        imageUrl: '',
        rating: '',
        reviewCount: '',
        rank: ''
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [productsRes, categoriesRes, salesRes] = await Promise.all([
                productApi.getAll(),
                categoryApi.getAll(),
                saleApi.getAll().catch(() => ({ data: [] }))
            ])
            setProducts(productsRes.data || [])
            setCategories(categoriesRes.data || [])
            setSales(salesRes.data || [])
        } catch (error) {
            toast.error('Erreur lors du chargement des données')
        } finally {
            setLoading(false)
        }
    }

    // Calculate KPIs
    const kpis = useMemo(() => {
        const totalProducts = products.length
        const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0)
        const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0)
        const avgPrice = totalProducts > 0 ? products.reduce((sum, p) => sum + (p.price || 0), 0) / totalProducts : 0
        const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length
        const outOfStockCount = products.filter(p => p.stock === 0).length
        const avgRating = totalProducts > 0 ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / totalProducts : 0

        // Products sold from sales data
        const productsSold = {}
        sales.forEach(sale => {
            if (sale.lignes && Array.isArray(sale.lignes)) {
                sale.lignes.forEach(ligne => {
                    productsSold[ligne.productId] = (productsSold[ligne.productId] || 0) + (ligne.quantity || 0)
                })
            }
        })
        const totalSoldQty = Object.values(productsSold).reduce((a, b) => a + b, 0)
        const bestSellingId = Object.entries(productsSold).sort((a, b) => b[1] - a[1])[0]?.[0]
        const bestSelling = products.find(p => p.id === parseInt(bestSellingId))

        return {
            totalProducts,
            totalStock,
            totalValue,
            avgPrice,
            lowStockCount,
            outOfStockCount,
            avgRating,
            totalSoldQty,
            bestSelling
        }
    }, [products, sales])

    const filteredProducts = useMemo(() => {
        let result = products.filter(product => {
            const matchesSearch = product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.asin?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = !filterCategory || product.categoryId === parseInt(filterCategory)

            // Filtres avancés
            const matchesPriceMin = !priceMin || product.price >= parseFloat(priceMin)
            const matchesPriceMax = !priceMax || product.price <= parseFloat(priceMax)

            let matchesStock = true
            if (stockFilter === 'out') matchesStock = product.stock === 0
            else if (stockFilter === 'low') matchesStock = product.stock > 0 && product.stock <= 10
            else if (stockFilter === 'ok') matchesStock = product.stock > 10

            const matchesRating = !ratingFilter || product.rating >= parseFloat(ratingFilter)

            return matchesSearch && matchesCategory && matchesPriceMin && matchesPriceMax && matchesStock && matchesRating
        })

        // Tri
        result.sort((a, b) => {
            let aVal = a[sortBy] || 0
            let bVal = b[sortBy] || 0
            if (typeof aVal === 'string') aVal = aVal.toLowerCase()
            if (typeof bVal === 'string') bVal = bVal.toLowerCase()
            if (sortOrder === 'asc') return aVal > bVal ? 1 : -1
            return aVal < bVal ? 1 : -1
        })

        return result
    }, [products, searchQuery, filterCategory, priceMin, priceMax, stockFilter, ratingFilter, sortBy, sortOrder])

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredProducts.slice(start, start + itemsPerPage)
    }, [filteredProducts, currentPage, itemsPerPage])

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, filterCategory, priceMin, priceMax, stockFilter, ratingFilter])

    const clearFilters = () => {
        setSearchQuery('')
        setFilterCategory('')
        setPriceMin('')
        setPriceMax('')
        setStockFilter('')
        setRatingFilter('')
        setSortBy('title')
        setSortOrder('asc')
    }

    const handleOpenModal = (product = null) => {
        if (product) {
            setSelectedProduct(product)
            setFormData({
                asin: product.asin || '',
                title: product.title || '',
                price: product.price?.toString() || '',
                stock: product.stock?.toString() || '',
                categoryId: product.categoryId?.toString() || '',
                imageUrl: product.imageUrl || '',
                rating: product.rating?.toString() || '',
                reviewCount: product.reviewCount?.toString() || '',
                rank: product.rank?.toString() || ''
            })
            setImagePreview(product.imageUrl || '')
        } else {
            setSelectedProduct(null)
            setFormData({
                asin: '',
                title: '',
                price: '',
                stock: '',
                categoryId: '',
                imageUrl: '',
                rating: '',
                reviewCount: '',
                rank: ''
            })
            setImagePreview('')
        }
        setImageFile(null)
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setSelectedProduct(null)
        setImageFile(null)
        setImagePreview('')
    }

    const openStockModal = (product) => {
        setSelectedProduct(product)
        setNewStock(product.stock?.toString() || '0')
        setShowStockModal(true)
    }

    const handleUpdateStock = async () => {
        if (!selectedProduct || newStock === '') return
        setUpdatingStock(true)
        try {
            await productApi.update(selectedProduct.id, {
                ...selectedProduct,
                stock: parseInt(newStock)
            })
            toast.success('Stock mis à jour')
            fetchData()
            setShowStockModal(false)
        } catch (error) {
            toast.error('Erreur lors de la mise à jour du stock')
        } finally {
            setUpdatingStock(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleImageSelect = (file) => {
        setImageFile(file)
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            let imageUrl = formData.imageUrl

            // Upload image to Cloudinary if new file selected
            if (imageFile) {
                try {
                    const uploadedUrl = await uploadToCloudinary(imageFile)
                    if (uploadedUrl) {
                        imageUrl = uploadedUrl
                    }
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError)
                    toast.error('Erreur lors de l\'upload de l\'image. Veuillez réessayer.')
                    setSubmitting(false)
                    return
                }
            }

            // Validation: imageUrl est requis
            if (!imageUrl || imageUrl.trim() === '') {
                toast.error('Veuillez sélectionner une image pour le produit')
                setSubmitting(false)
                return
            }

            const productData = {
                asin: formData.asin || `ASIN-${Date.now()}`,
                title: formData.title,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                categoryId: parseInt(formData.categoryId),
                imageUrl: imageUrl,
                // Valeurs par défaut à 0 - le vendeur n'a pas besoin de les saisir
                rating: parseFloat(formData.rating) || 0,
                reviewCount: parseInt(formData.reviewCount) || 0,
                rank: parseInt(formData.rank) || 0
            }

            if (selectedProduct) {
                await productApi.update(selectedProduct.id, productData)
                toast.success('Produit mis à jour avec succès')
            } else {
                await productApi.create(productData)
                toast.success('Produit créé avec succès')
            }

            fetchData()
            handleCloseModal()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedProduct) return

        try {
            await productApi.delete(selectedProduct.id)
            toast.success('Produit supprimé avec succès')
            fetchData()
            setShowDeleteConfirm(false)
            setSelectedProduct(null)
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    const openDeleteConfirm = (product) => {
        setSelectedProduct(product)
        setShowDeleteConfirm(true)
    }

    // Import Logic
    const [showImportModal, setShowImportModal] = useState(false)
    const [importFile, setImportFile] = useState(null)
    const [importing, setImporting] = useState(false)
    const [importSummary, setImportSummary] = useState(null)
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleFile = (file) => {
        if (file && file.type === "text/csv" || file.name.endsWith('.csv')) {
            setImportFile(file)
            setImportSummary(null)
        } else {
            toast.error("Veuillez sélectionner un fichier CSV valide")
        }
    }

    const handleImportSubmit = async () => {
        if (!importFile) return

        setImporting(true)
        const formData = new FormData()
        formData.append('file', importFile)

        try {
            const res = await productApi.import(formData)
            setImportSummary(res.data)
            fetchData()
            if (res.data.failureCount === 0) {
                toast.success(`${res.data.successCount} produits importés avec succès`)
                setTimeout(() => {
                    handleCloseImportModal()
                }, 2000)
            } else {
                toast.success(`Import terminé: ${res.data.successCount} succès, ${res.data.failureCount} erreurs`)
            }
        } catch (error) {
            console.error("Import error", error)
            toast.error(error.response?.data?.message || "Erreur lors de l'import")
        } finally {
            setImporting(false)
        }
    }

    const handleCloseImportModal = () => {
        setShowImportModal(false)
        setImportFile(null)
        setImportSummary(null)
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Produits</h1>
                    <p className="text-dark-500">{products.length} produits au total</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={fetchData}>
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" onClick={() => setShowImportModal(true)}>
                        <Upload className="w-5 h-5 mr-2" />
                        Importer CSV
                    </Button>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="w-5 h-5 mr-2" />
                        Nouveau Produit
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="p-4 bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-200/50 dark:border-primary-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <Package className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">Total Produits</p>
                                <p className="text-lg font-bold text-dark-900 dark:text-white">{formatNumber(kpis.totalProducts)}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <Card className="p-4 bg-gradient-to-br from-success-500/10 to-success-600/5 border-success-200/50 dark:border-success-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-success-600" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">Stock Total</p>
                                <p className="text-lg font-bold text-dark-900 dark:text-white">{formatNumber(kpis.totalStock)}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="p-4 bg-gradient-to-br from-secondary-500/10 to-secondary-600/5 border-secondary-200/50 dark:border-secondary-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-secondary-600" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">Valeur Stock</p>
                                <p className="text-lg font-bold text-dark-900 dark:text-white">{formatCurrency(kpis.totalValue)}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <Card className="p-4 bg-gradient-to-br from-warning-500/10 to-warning-600/5 border-warning-200/50 dark:border-warning-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-warning-600" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">Stock Faible</p>
                                <p className="text-lg font-bold text-warning-600">{kpis.lowStockCount}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="p-4 bg-gradient-to-br from-danger-500/10 to-danger-600/5 border-danger-200/50 dark:border-danger-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-danger-600" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">Rupture</p>
                                <p className="text-lg font-bold text-danger-600">{kpis.outOfStockCount}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200/50 dark:border-amber-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Star className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">Note Moyenne</p>
                                <p className="text-lg font-bold text-dark-900 dark:text-white">{kpis.avgRating.toFixed(1)}/5</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-dark-500 mb-1">Prix moyen</p>
                                <p className="text-xl font-bold text-dark-900 dark:text-white">{formatCurrency(kpis.avgPrice)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-dark-500 mb-1">Unités vendues</p>
                                <p className="text-xl font-bold text-success-600">{formatNumber(kpis.totalSoldQty)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-emerald-500 flex items-center justify-center">
                                <ShoppingCart className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-dark-500 mb-1">Meilleure vente</p>
                                <p className="text-sm font-bold text-dark-900 dark:text-white truncate">
                                    {kpis.bestSelling?.title || 'Aucune vente'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <SearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Rechercher un produit..."
                            />
                        </div>
                        <div className="sm:w-48">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Toutes les catégories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="flex items-center gap-2"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filtres avancés
                            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                        </Button>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                                    <div>
                                        <label className="block text-xs font-medium text-dark-500 mb-1">Prix min</label>
                                        <input
                                            type="number"
                                            value={priceMin}
                                            onChange={(e) => setPriceMin(e.target.value)}
                                            placeholder="0"
                                            className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-dark-500 mb-1">Prix max</label>
                                        <input
                                            type="number"
                                            value={priceMax}
                                            onChange={(e) => setPriceMax(e.target.value)}
                                            placeholder="∞"
                                            className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-dark-500 mb-1">Stock</label>
                                        <select
                                            value={stockFilter}
                                            onChange={(e) => setStockFilter(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Tous</option>
                                            <option value="out">Rupture (0)</option>
                                            <option value="low">Faible (1-10)</option>
                                            <option value="ok">En stock (10+)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-dark-500 mb-1">Note min</label>
                                        <select
                                            value={ratingFilter}
                                            onChange={(e) => setRatingFilter(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Toutes</option>
                                            <option value="4">4+ étoiles</option>
                                            <option value="3">3+ étoiles</option>
                                            <option value="2">2+ étoiles</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-dark-500 mb-1">Trier par</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="title">Nom</option>
                                                <option value="price">Prix</option>
                                                <option value="stock">Stock</option>
                                                <option value="rating">Note</option>
                                            </select>
                                            <button
                                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                                className="px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-dark-700"
                                            >
                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <X className="w-4 h-4 mr-1" />
                                        Effacer les filtres
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>

            {/* Results count */}
            <div className="text-sm text-dark-500">
                {filteredProducts.length} produit(s) trouvé(s)
            </div>

            {/* Products Grid */}
            {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {paginatedProducts.map((product, index) => {
                            const stockStatus = getStockStatus(product.stock)
                            return (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                                        {/* Image */}
                                        <div className="aspect-square bg-dark-100 dark:bg-dark-800 relative overflow-hidden">
                                            {product.imageUrl ? (
                                                <img
                                                    src={getOptimizedImageUrl(product.imageUrl, 400)}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-16 h-16 text-dark-300" />
                                                </div>
                                            )}
                                            {/* Stock badge */}
                                            <div className="absolute top-3 right-3">
                                                <Badge variant={stockStatus.variant}>
                                                    {stockStatus.label}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-dark-900 dark:text-white truncate">
                                                        {product.title}
                                                    </h3>
                                                    <p className="text-sm text-dark-500 truncate">
                                                        {product.categoryName || 'Sans catégorie'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => navigate(`/admin/products/${product.id}`)}
                                                        className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                        title="Voir détails"
                                                    >
                                                        <Eye className="w-4 h-4 text-primary-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => openStockModal(product)}
                                                        className="p-2 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors"
                                                        title="Modifier stock"
                                                    >
                                                        <RefreshCw className="w-4 h-4 text-success-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(product)}
                                                        className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-dark-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteConfirm(product)}
                                                        className="p-2 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-danger-500" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Rating */}
                                            {product.rating > 0 && (
                                                <div className="flex items-center gap-1 mb-2">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                                                    <span className="text-sm text-dark-400">({product.reviewCount} avis)</span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                                    {formatCurrency(product.price)}
                                                </p>
                                                <p className="text-sm text-dark-500">
                                                    Stock: {product.stock}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <EmptyState
                    icon={Package}
                    title="Aucun produit trouvé"
                    description="Ajoutez votre premier produit pour commencer"
                    action={
                        <Button onClick={() => handleOpenModal()}>
                            <Plus className="w-5 h-5 mr-2" />
                            Ajouter un produit
                        </Button>
                    }
                />
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                    totalItems={filteredProducts.length}
                />
            )}

            {/* Product Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={selectedProduct ? 'Modifier le produit' : 'Nouveau produit'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div className="flex flex-col items-center gap-2">
                        <ImageUpload
                            value={imagePreview}
                            onChange={handleImageSelect}
                            className="w-40 h-40"
                        />
                        <p className="text-xs text-dark-500 dark:text-dark-400">
                            Image <span className="text-red-500">*</span> (obligatoire)
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Titre du produit"
                            placeholder="Généré automatiquement si vide"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                                Catégorie
                            </label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Sélectionner une catégorie</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Prix (MAD)"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            label="Stock"
                            name="stock"
                            type="number"
                            min="0"
                            value={formData.stock}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Champs avancés (optionnels) - masqués par défaut */}
                    <details className="text-sm">
                        <summary className="cursor-pointer text-dark-500 dark:text-dark-400 hover:text-primary-500">
                            Options avancées (Note, Avis, Rang)
                        </summary>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <Input
                                label="Note (0-5)"
                                name="rating"
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={formData.rating}
                                onChange={handleChange}
                                placeholder="0"
                            />
                            <Input
                                label="Nombre d'avis"
                                name="reviewCount"
                                type="number"
                                min="0"
                                value={formData.reviewCount}
                                onChange={handleChange}
                                placeholder="0"
                            />
                            <Input
                                label="Rang (classement)"
                                name="rank"
                                type="number"
                                min="0"
                                value={formData.rank}
                                onChange={handleChange}
                                placeholder="0"
                            />
                        </div>
                    </details>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                        <Button type="button" variant="ghost" onClick={handleCloseModal}>
                            Annuler
                        </Button>
                        <Button type="submit" loading={submitting}>
                            {selectedProduct ? 'Mettre à jour' : 'Créer'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Stock Update Modal */}
            <Modal
                isOpen={showStockModal}
                onClose={() => setShowStockModal(false)}
                title="Modifier le stock"
            >
                <div className="space-y-4">
                    {selectedProduct && (
                        <>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
                                {selectedProduct.imageUrl ? (
                                    <img
                                        src={selectedProduct.imageUrl}
                                        alt={selectedProduct.title}
                                        className="w-16 h-16 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-dark-700 flex items-center justify-center">
                                        <Package className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-dark-900 dark:text-white">
                                        {selectedProduct.title}
                                    </h3>
                                    <p className="text-sm text-dark-500">
                                        Stock actuel: <span className="font-medium">{selectedProduct.stock}</span> unités
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                    Nouveau stock
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newStock}
                                    onChange={(e) => setNewStock(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Entrez la nouvelle quantité"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                                <Button variant="ghost" onClick={() => setShowStockModal(false)}>
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleUpdateStock}
                                    loading={updatingStock}
                                    className="bg-success-500 hover:bg-success-600"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Mettre à jour
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Supprimer le produit"
                message={`Êtes-vous sûr de vouloir supprimer "${selectedProduct?.title}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
            />

            {/* Import Modal */}
            <Modal
                isOpen={showImportModal}
                onClose={handleCloseImportModal}
                title="Importer des produits"
                size="lg"
            >
                {!importSummary ? (
                    <div className="space-y-4">
                        <div
                            className={`relative border-2 border-dashed rounded-xl p-8 transition-all text-center
                        ${dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-300 dark:border-dark-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
                                accept=".csv"
                            />

                            <div className="flex flex-col items-center justify-center pointer-events-none">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
                            ${importFile ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 dark:bg-dark-700 text-gray-400'}`}>
                                    {importFile ? <FileText className="w-8 h-8" /> : <Cloud className="w-8 h-8" />}
                                </div>

                                {importFile ? (
                                    <>
                                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-1">
                                            {importFile.name}
                                        </h3>
                                        <p className="text-sm text-dark-500">
                                            {(importFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-1">
                                            Glissez votre fichier CSV ici
                                        </h3>
                                        <p className="text-sm text-dark-500 mb-4">
                                            ou cliquez pour parcourir
                                        </p>
                                        <div className="text-xs text-dark-400 bg-gray-50 dark:bg-dark-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-dark-700">
                                            Format requis: title, price, stock, category
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={handleCloseImportModal}>
                                Annuler
                            </Button>
                            <Button
                                onClick={handleImportSubmit}
                                disabled={!importFile}
                                loading={importing}
                                className="bg-primary-600 hover:bg-primary-700 text-white"
                            >
                                Importer maintenant
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4
                        ${importSummary.failureCount === 0 ? 'bg-success-100 text-success-600' : 'bg-warning-100 text-warning-600'}`}>
                                {importSummary.failureCount === 0 ? (
                                    <CheckCircle className="w-10 h-10" />
                                ) : (
                                    <AlertCircle className="w-10 h-10" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-2">
                                {importSummary.failureCount === 0 ? 'Import réussi !' : 'Import terminé avec erreurs'}
                            </h3>
                            <p className="text-dark-500 text-center max-w-sm">
                                {importSummary.successCount} produits ont été ajoutés ou mis à jour avec succès.
                                {importSummary.failureCount > 0 && ` Cependant, ${importSummary.failureCount} lignes ont été ignorées.`}
                            </p>
                        </div>

                        {importSummary.errors && importSummary.errors.length > 0 && (
                            <div className="bg-danger-50 dark:bg-danger-900/10 border border-danger-100 dark:border-danger-900/20 rounded-xl p-4 max-h-60 overflow-y-auto">
                                <h4 className="flex items-center gap-2 text-danger-700 dark:text-danger-400 font-semibold mb-3">
                                    <AlertTriangle className="w-4 h-4" />
                                    Erreurs rencontrées ({importSummary.failureCount})
                                </h4>
                                <div className="space-y-2">
                                    {importSummary.errors.map((error, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-sm text-danger-600 dark:text-danger-300">
                                            <span className="mt-0.5">•</span>
                                            <span>{error}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center">
                            <Button onClick={handleCloseImportModal} size="lg">
                                Terminer
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    )
}
