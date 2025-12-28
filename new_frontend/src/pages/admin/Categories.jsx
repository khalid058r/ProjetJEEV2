import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Package, Sparkles, Shirt, Laptop, Home, Utensils, Dumbbell, Gamepad, Car, Book, Gift, Heart, Camera, Music, Palette, Eye, TrendingUp, DollarSign, Layers, BarChart3, RefreshCw, ShoppingCart } from 'lucide-react'
import { categoryApi, productApi, saleApi } from '../../api'
import { Button, Card, Modal, Input, Loading, EmptyState, ConfirmDialog, SearchInput, Pagination } from '../../components/ui'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function Categories() {
    const navigate = useNavigate()
    const [categories, setCategories] = useState([])
    const [products, setProducts] = useState([])
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [formData, setFormData] = useState({ name: '', description: '' })
    const [submitting, setSubmitting] = useState(false)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(8)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [categoriesRes, productsRes, salesRes] = await Promise.all([
                categoryApi.getAll(),
                productApi.getAll(),
                saleApi.getAll().catch(() => ({ data: [] }))
            ])
            setCategories(categoriesRes.data || [])
            setProducts(productsRes.data || [])
            setSales(salesRes.data || [])
        } catch (error) {
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    // Calculate KPIs
    const kpis = useMemo(() => {
        const totalCategories = categories.length
        const totalProducts = products.length
        const avgProductsPerCategory = totalCategories > 0 ? totalProducts / totalCategories : 0

        // Category with most products
        const categoryProductCount = {}
        products.forEach(p => {
            categoryProductCount[p.categoryId] = (categoryProductCount[p.categoryId] || 0) + 1
        })
        const topCategoryId = Object.entries(categoryProductCount).sort((a, b) => b[1] - a[1])[0]?.[0]
        const topCategory = categories.find(c => c.id === parseInt(topCategoryId))

        // Create productCategoryMap
        const productCategoryMap = {}
        products.forEach(p => {
            productCategoryMap[p.id] = p.categoryId
        })

        // Sales by category
        const categorySales = {}
        sales.forEach(sale => {
            if (sale.lignes && Array.isArray(sale.lignes)) {
                sale.lignes.forEach(ligne => {
                    const catId = productCategoryMap[ligne.productId]
                    if (catId) {
                        categorySales[catId] = (categorySales[catId] || 0) + (ligne.lineTotal || 0)
                    }
                })
            }
        })

        const totalRevenue = Object.values(categorySales).reduce((a, b) => a + b, 0)
        const topSellingCatId = Object.entries(categorySales).sort((a, b) => b[1] - a[1])[0]?.[0]
        const topSellingCategory = categories.find(c => c.id === parseInt(topSellingCatId))

        // Empty categories
        const emptyCategories = categories.filter(c => !categoryProductCount[c.id]).length

        // Categories with low stock products
        const categoriesWithLowStock = new Set()
        products.forEach(p => {
            if (p.stock <= 10 && p.categoryId) {
                categoriesWithLowStock.add(p.categoryId)
            }
        })

        return {
            totalCategories,
            totalProducts,
            avgProductsPerCategory,
            topCategory,
            totalRevenue,
            topSellingCategory,
            emptyCategories,
            categoriesWithLowStock: categoriesWithLowStock.size,
            categorySales
        }
    }, [categories, products, sales])

    const getProductCount = (categoryId) => {
        return products.filter(p => p.categoryId === categoryId).length
    }

    const filteredCategories = categories.filter(cat =>
        cat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Pagination
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
    const paginatedCategories = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredCategories.slice(start, start + itemsPerPage)
    }, [filteredCategories, currentPage, itemsPerPage])

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const handleOpenModal = (category = null) => {
        if (category) {
            setSelectedCategory(category)
            setFormData({ name: category.name || '', description: category.description || '' })
        } else {
            setSelectedCategory(null)
            setFormData({ name: '', description: '' })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setSelectedCategory(null)
        setFormData({ name: '', description: '' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            if (selectedCategory) {
                await categoryApi.update(selectedCategory.id, formData)
                toast.success('Catégorie mise à jour')
            } else {
                await categoryApi.create(formData)
                toast.success('Catégorie créée')
            }
            fetchData()
            handleCloseModal()
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedCategory) return

        try {
            await categoryApi.delete(selectedCategory.id)
            toast.success('Catégorie supprimée')
            fetchData()
            setShowDeleteConfirm(false)
            setSelectedCategory(null)
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    const openDeleteConfirm = (category) => {
        setSelectedCategory(category)
        setShowDeleteConfirm(true)
    }

    if (loading) return <Loading />

    // Category icons based on name keywords
    const getCategoryIcon = (categoryName) => {
        const name = categoryName?.toLowerCase() || ''
        if (name.includes('électro') || name.includes('tech') || name.includes('ordi')) return Laptop
        if (name.includes('vêtement') || name.includes('mode') || name.includes('habit')) return Shirt
        if (name.includes('maison') || name.includes('meuble') || name.includes('déco')) return Home
        if (name.includes('cuisine') || name.includes('aliment') || name.includes('food')) return Utensils
        if (name.includes('sport') || name.includes('fitness')) return Dumbbell
        if (name.includes('jeu') || name.includes('game') || name.includes('jouet')) return Gamepad
        if (name.includes('auto') || name.includes('voiture') || name.includes('moto')) return Car
        if (name.includes('livre') || name.includes('book') || name.includes('éduc')) return Book
        if (name.includes('cadeau') || name.includes('gift')) return Gift
        if (name.includes('santé') || name.includes('beauté') || name.includes('soin')) return Heart
        if (name.includes('photo') || name.includes('caméra')) return Camera
        if (name.includes('musique') || name.includes('audio')) return Music
        if (name.includes('art') || name.includes('créat')) return Palette
        return Sparkles
    }

    // Category colors
    const colors = [
        'from-violet-500 to-purple-600',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-amber-500',
        'from-rose-500 to-pink-500',
        'from-indigo-500 to-blue-500',
        'from-fuchsia-500 to-pink-500',
        'from-lime-500 to-green-500'
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Catégories</h1>
                    <p className="text-dark-500">{categories.length} catégories au total</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={fetchData}>
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="w-5 h-5 mr-2" />
                        Nouvelle Catégorie
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
                                <Layers className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">Catégories</p>
                                <p className="text-lg font-bold text-dark-900 dark:text-white">{formatNumber(kpis.totalCategories)}</p>
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
                                <Package className="w-5 h-5 text-success-600" />
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
                    transition={{ delay: 0.2 }}
                >
                    <Card className="p-4 bg-gradient-to-br from-secondary-500/10 to-secondary-600/5 border-secondary-200/50 dark:border-secondary-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-secondary-600" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">Moy. Produits</p>
                                <p className="text-lg font-bold text-dark-900 dark:text-white">{kpis.avgProductsPerCategory.toFixed(1)}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">CA Total</p>
                                <p className="text-lg font-bold text-emerald-600">{formatCurrency(kpis.totalRevenue)}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="p-4 bg-gradient-to-br from-warning-500/10 to-warning-600/5 border-warning-200/50 dark:border-warning-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-warning-600" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">Cat. Vides</p>
                                <p className="text-lg font-bold text-warning-600">{kpis.emptyCategories}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <Card className="p-4 bg-gradient-to-br from-danger-500/10 to-danger-600/5 border-danger-200/50 dark:border-danger-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5 text-danger-600" />
                            </div>
                            <div>
                                <p className="text-xs text-dark-500">Stock Faible</p>
                                <p className="text-lg font-bold text-danger-600">{kpis.categoriesWithLowStock}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Top Categories Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-dark-500 mb-1">Catégorie la plus fournie</p>
                                <p className="text-lg font-bold text-dark-900 dark:text-white truncate">
                                    {kpis.topCategory?.name || 'Aucune'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-dark-500 mb-1">Meilleure catégorie (CA)</p>
                                <p className="text-lg font-bold text-success-600 truncate">
                                    {kpis.topSellingCategory?.name || 'Aucune vente'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Search */}
            <Card className="p-4">
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Rechercher une catégorie..."
                />
            </Card>

            {/* Categories Grid */}
            {paginatedCategories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {paginatedCategories.map((category, index) => {
                            const productCount = getProductCount(category.id)
                            const colorClass = colors[index % colors.length]

                            return (
                                <motion.div
                                    key={category.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="overflow-hidden hover:shadow-lg transition-all group">
                                        {/* Color Header */}
                                        <div className={`h-24 bg-gradient-to-r ${colorClass} relative`}>
                                            <div className="absolute inset-0 bg-black/10" />
                                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/20 to-transparent" />
                                            <div className="absolute bottom-4 left-4">
                                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                    {(() => {
                                                        const IconComponent = getCategoryIcon(category.name)
                                                        return <IconComponent className="w-6 h-6 text-white" />
                                                    })()}
                                                </div>
                                            </div>
                                            {/* Actions */}
                                            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => navigate(`/admin/categories/${category.id}`)}
                                                    className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-colors"
                                                    title="Voir détails"
                                                >
                                                    <Eye className="w-4 h-4 text-white" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(category)}
                                                    className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4 text-white" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteConfirm(category)}
                                                    className="p-2 bg-white/20 backdrop-blur-sm hover:bg-danger-500/50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-semibold text-dark-900 dark:text-white mb-1">
                                                {category.name}
                                            </h3>
                                            {category.description && (
                                                <p className="text-sm text-dark-500 line-clamp-2 mb-3">
                                                    {category.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 text-sm text-dark-500">
                                                <Package className="w-4 h-4" />
                                                {productCount} produit{productCount !== 1 ? 's' : ''}
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
                    icon={Sparkles}
                    title="Aucune catégorie trouvée"
                    description="Créez votre première catégorie pour organiser vos produits"
                    action={
                        <Button onClick={() => handleOpenModal()}>
                            <Plus className="w-5 h-5 mr-2" />
                            Ajouter une catégorie
                        </Button>
                    }
                />
            )}

            {/* Pagination */}
            {filteredCategories.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                    totalItems={filteredCategories.length}
                />
            )}

            {/* Category Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={selectedCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nom de la catégorie"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                            Description (optionnelle)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                        <Button type="button" variant="ghost" onClick={handleCloseModal}>
                            Annuler
                        </Button>
                        <Button type="submit" loading={submitting}>
                            {selectedCategory ? 'Mettre à jour' : 'Créer'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Supprimer la catégorie"
                message={`Êtes-vous sûr de vouloir supprimer "${selectedCategory?.name}" ? Les produits associés ne seront pas supprimés.`}
                confirmText="Supprimer"
                variant="danger"
            />
        </div>
    )
}
