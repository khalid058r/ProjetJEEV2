import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertTriangle, Package, TrendingDown, ArrowLeft, Edit2,
    Eye, RefreshCw, Bell, Download, Filter, Search
} from 'lucide-react'
import { productApi, categoryApi, analyticsApi } from '../../api'
import { Button, Card, Badge, Loading, EmptyState, SearchInput, Modal, Input } from '../../components/ui'
import { formatCurrency, getStockStatus } from '../../utils/formatters'
import { getOptimizedImageUrl } from '../../utils/cloudinary'
import toast from 'react-hot-toast'

export default function LowStock() {
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [threshold, setThreshold] = useState(10)
    const [showStockModal, setShowStockModal] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [newStock, setNewStock] = useState('')
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchData()
    }, [threshold])

    const fetchData = async () => {
        try {
            setLoading(true)

            // 🚀 Utiliser l'endpoint Analytics optimisé pour les produits à stock faible
            const [lowStockRes, categoriesRes] = await Promise.all([
                analyticsApi.getLowStockProducts(threshold).catch(() => null),
                categoryApi.getAll()
            ])

            // Si l'API Analytics fonctionne, utiliser ses données
            // Backend retourne: { value: [...], Count: n }
            const lowStockData = lowStockRes?.data?.value || lowStockRes?.data
            if (lowStockData && Array.isArray(lowStockData)) {
                // L'API retourne déjà les produits filtrés et triés
                setProducts(lowStockData.map(p => ({
                    id: p.productId || p.id,
                    title: p.title || p.productName,
                    stock: p.stock || p.currentStock || 0,
                    price: p.price,
                    categoryId: p.categoryId,
                    categoryName: p.categoryName,
                    imageUrl: p.imageUrl
                })))
            } else {
                // Fallback: charger tous les produits et filtrer localement
                const productsRes = await productApi.getAll()
                setProducts(productsRes.data || [])
            }

            setCategories(categoriesRes.data || [])
        } catch (error) {
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const lowStockProducts = products
        .filter(p => p.stock <= threshold)
        .filter(p => {
            const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = !filterCategory || p.categoryId === parseInt(filterCategory)
            return matchesSearch && matchesCategory
        })
        .sort((a, b) => a.stock - b.stock)

    const outOfStock = lowStockProducts.filter(p => p.stock === 0)
    const criticalStock = lowStockProducts.filter(p => p.stock > 0 && p.stock <= 5)
    const lowStock = lowStockProducts.filter(p => p.stock > 5)

    const openStockModal = (product) => {
        setSelectedProduct(product)
        setNewStock(product.stock.toString())
        setShowStockModal(true)
    }

    const handleUpdateStock = async () => {
        if (!selectedProduct || !newStock) return
        setUpdating(true)
        try {
            await productApi.update(selectedProduct.id, {
                ...selectedProduct,
                stock: parseInt(newStock)
            })
            toast.success('Stock mis à jour')
            fetchData()
            setShowStockModal(false)
        } catch (error) {
            toast.error('Erreur lors de la mise à jour')
        } finally {
            setUpdating(false)
        }
    }

    const exportCSV = () => {
        const headers = ['ID', 'Produit', 'Catégorie', 'Stock', 'Prix', 'Statut']
        const rows = lowStockProducts.map(p => [
            p.id,
            p.title,
            p.categoryName || 'N/A',
            p.stock,
            p.price,
            p.stock === 0 ? 'Rupture' : p.stock <= 5 ? 'Critique' : 'Faible'
        ])
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `stock-faible-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        toast.success('Export CSV généré')
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/admin')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="w-7 h-7 text-warning-500" />
                            Alertes Stock Faible
                        </h1>
                        <p className="text-dark-500">{lowStockProducts.length} produits nécessitent une attention</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualiser
                    </Button>
                    <Button variant="outline" onClick={exportCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-danger-500 to-red-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-danger-100 text-sm">Rupture de stock</p>
                            <p className="text-3xl font-bold">{outOfStock.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-warning-500 to-orange-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-warning-100 text-sm">Stock critique (1-5)</p>
                            <p className="text-3xl font-bold">{criticalStock.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-secondary-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-secondary-100 text-sm">Stock faible (6-{threshold})</p>
                            <p className="text-3xl font-bold">{lowStock.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <TrendingDown className="w-6 h-6" />
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
                            placeholder="Rechercher un produit..."
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Toutes catégories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-dark-500">Seuil:</label>
                            <input
                                type="number"
                                value={threshold}
                                onChange={(e) => setThreshold(parseInt(e.target.value) || 10)}
                                min="1"
                                max="100"
                                className="w-20 px-3 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Products List */}
            {lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                    {/* Out of Stock */}
                    {outOfStock.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-danger-600 mb-3 flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Rupture de stock ({outOfStock.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {outOfStock.map((product, index) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        index={index}
                                        variant="danger"
                                        onEdit={() => openStockModal(product)}
                                        onView={() => navigate(`/admin/products/${product.id}`)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Critical Stock */}
                    {criticalStock.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-warning-600 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Stock critique ({criticalStock.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {criticalStock.map((product, index) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        index={index}
                                        variant="warning"
                                        onEdit={() => openStockModal(product)}
                                        onView={() => navigate(`/admin/products/${product.id}`)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Low Stock */}
                    {lowStock.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-secondary-600 mb-3 flex items-center gap-2">
                                <TrendingDown className="w-5 h-5" />
                                Stock faible ({lowStock.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {lowStock.map((product, index) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        index={index}
                                        variant="secondary"
                                        onEdit={() => openStockModal(product)}
                                        onView={() => navigate(`/admin/products/${product.id}`)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState
                    icon={Package}
                    title="Aucun produit en stock faible"
                    description="Tous vos produits ont un stock suffisant"
                />
            )}

            {/* Stock Update Modal */}
            <Modal
                isOpen={showStockModal}
                onClose={() => setShowStockModal(false)}
                title="Modifier le stock"
            >
                {selectedProduct && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center overflow-hidden">
                                {selectedProduct.imageUrl ? (
                                    <img src={getOptimizedImageUrl(selectedProduct.imageUrl, 200)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Package className="w-8 h-8 text-primary-500" />
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-dark-900 dark:text-white">{selectedProduct.title}</p>
                                <p className="text-sm text-dark-500">{selectedProduct.categoryName}</p>
                                <Badge variant={selectedProduct.stock === 0 ? 'danger' : selectedProduct.stock <= 5 ? 'warning' : 'secondary'}>
                                    Stock actuel: {selectedProduct.stock}
                                </Badge>
                            </div>
                        </div>

                        <Input
                            label="Nouveau stock"
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            min="0"
                            required
                        />

                        <div className="flex gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setShowStockModal(false)} className="flex-1">
                                Annuler
                            </Button>
                            <Button onClick={handleUpdateStock} loading={updating} className="flex-1">
                                Mettre à jour
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

// Product Card Component
function ProductCard({ product, index, variant, onEdit, onView }) {
    const colors = {
        danger: 'border-danger-500 bg-danger-50 dark:bg-danger-900/20',
        warning: 'border-warning-500 bg-warning-50 dark:bg-warning-900/20',
        secondary: 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card className={`p-4 border-l-4 ${colors[variant]} hover:shadow-lg transition-all`}>
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.imageUrl ? (
                            <img src={getOptimizedImageUrl(product.imageUrl, 100)} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Package className="w-7 h-7 text-primary-500" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-dark-900 dark:text-white truncate">{product.title}</h4>
                        <p className="text-sm text-dark-500 truncate">{product.categoryName || 'Sans catégorie'}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`text-lg font-bold ${variant === 'danger' ? 'text-danger-600' : variant === 'warning' ? 'text-warning-600' : 'text-secondary-600'}`}>
                                Stock: {product.stock}
                            </span>
                            <span className="text-sm text-dark-500">{formatCurrency(product.price)}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={onView}
                            className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                            title="Voir"
                        >
                            <Eye className="w-4 h-4 text-primary-500" />
                        </button>
                        <button
                            onClick={onEdit}
                            className="p-2 hover:bg-success-100 dark:hover:bg-success-900/30 rounded-lg transition-colors"
                            title="Modifier stock"
                        >
                            <Edit2 className="w-4 h-4 text-success-500" />
                        </button>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
