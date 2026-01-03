import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft, Edit2, Trash2, Package, Tag, TrendingUp,
    ShoppingCart, Star, BarChart3, AlertTriangle, Calendar,
    DollarSign, Layers, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react'
import { productApi, categoryApi, saleApi } from '../../api'
import { Button, Card, Badge, Loading, ConfirmDialog } from '../../components/ui'
import { AreaChartComponent, BarChartComponent } from '../../components/charts'
import { formatCurrency, formatDate, formatNumber, getStockStatus } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [category, setCategory] = useState(null)
    const [salesData, setSalesData] = useState([])
    const [productStats, setProductStats] = useState({
        totalSold: 0,
        totalRevenue: 0,
        avgPerSale: 0,
        lastSaleDate: null,
        monthlySales: []
    })
    const [loading, setLoading] = useState(true)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    useEffect(() => {
        if (id) fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [productRes, salesRes, categoriesRes] = await Promise.all([
                productApi.getById(id),
                saleApi.getAll().catch(() => ({ data: [] })),
                categoryApi.getAll().catch(() => ({ data: [] }))
            ])

            const prod = productRes.data
            setProduct(prod)

            // Get category
            const cat = categoriesRes.data?.find(c => c.id === prod.categoryId)
            setCategory(cat)

            // Calculate product stats from sales
            const sales = salesRes.data || []
            let totalSold = 0
            let totalRevenue = 0
            let saleCount = 0
            let lastSaleDate = null
            const monthlySalesMap = {}

            sales.forEach(sale => {
                if (sale.lignes) {
                    sale.lignes.forEach(ligne => {
                        if (ligne.productId === parseInt(id)) {
                            totalSold += ligne.quantity || 0
                            totalRevenue += ligne.lineTotal || 0
                            saleCount++

                            const saleDate = new Date(sale.saleDate)
                            if (!lastSaleDate || saleDate > lastSaleDate) {
                                lastSaleDate = saleDate
                            }

                            // Monthly aggregation
                            const monthKey = saleDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
                            if (!monthlySalesMap[monthKey]) {
                                monthlySalesMap[monthKey] = { quantity: 0, revenue: 0 }
                            }
                            monthlySalesMap[monthKey].quantity += ligne.quantity || 0
                            monthlySalesMap[monthKey].revenue += ligne.lineTotal || 0
                        }
                    })
                }
            })

            // Convert monthly data to array for chart
            const monthlySales = Object.entries(monthlySalesMap)
                .map(([name, data]) => ({ name, ...data }))
                .slice(-6) // Last 6 months

            setProductStats({
                totalSold,
                totalRevenue,
                avgPerSale: saleCount > 0 ? totalRevenue / saleCount : 0,
                lastSaleDate,
                monthlySales
            })

            // Recent sales with this product
            const productSales = sales.filter(sale =>
                sale.lignes?.some(l => l.productId === parseInt(id))
            ).slice(0, 10)
            setSalesData(productSales)

        } catch (error) {
            toast.error('Erreur lors du chargement')
            navigate('/admin/products')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            await productApi.delete(id)
            toast.success('Produit supprimé')
            navigate('/admin/products')
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    if (loading) return <Loading />
    if (!product) return null

    const stockStatus = getStockStatus(product.stock)

    return (
        <div className="space-y-6">
            {/* Back Button & Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/admin/products')}
                    className="flex items-center gap-2 text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Retour aux produits</span>
                </button>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate(`/admin/products?edit=${id}`)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Modifier
                    </Button>
                    <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                    </Button>
                </div>
            </div>

            {/* Product Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Product Image & Info */}
                <Card className="lg:col-span-1 overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-dark-700 dark:to-dark-800 relative">
                        {product.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Package className="w-24 h-24 text-primary-300 dark:text-dark-600" />
                            </div>
                        )}
                        {product.stock <= 5 && (
                            <div className="absolute top-4 right-4">
                                <Badge variant="danger" className="flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Stock faible
                                </Badge>
                            </div>
                        )}
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">{product.title}</h1>
                            {product.asin && (
                                <p className="text-sm text-dark-500 mt-1">ASIN: {product.asin}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-primary-500" />
                            <span className="text-primary-600 dark:text-primary-400 font-medium">
                                {category?.name || 'Non catégorisé'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-dark-700">
                            <span className="text-dark-500">Prix unitaire</span>
                            <span className="text-2xl font-bold text-success-600">{formatCurrency(product.price)}</span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-dark-700">
                            <span className="text-dark-500">Stock disponible</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-xl font-bold ${stockStatus.color}`}>{product.stock}</span>
                                <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                            </div>
                        </div>

                        {product.rating && (
                            <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-dark-700">
                                <span className="text-dark-500">Note</span>
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-warning-500 fill-warning-500" />
                                    <span className="font-bold text-dark-900 dark:text-white">{product.rating}</span>
                                    {product.reviewCount && (
                                        <span className="text-sm text-dark-500">({formatNumber(product.reviewCount)} avis)</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Stats Cards */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-dark-500">Vendus</p>
                                    <p className="text-xl font-bold text-dark-900 dark:text-white">{formatNumber(productStats.totalSold)}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-success-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-dark-500">Revenus</p>
                                    <p className="text-xl font-bold text-success-600">{formatCurrency(productStats.totalRevenue)}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-secondary-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-dark-500">Panier moyen</p>
                                    <p className="text-xl font-bold text-dark-900 dark:text-white">{formatCurrency(productStats.avgPerSale)}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-warning-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-dark-500">Dernière vente</p>
                                    <p className="text-sm font-bold text-dark-900 dark:text-white">
                                        {productStats.lastSaleDate ? formatDate(productStats.lastSaleDate) : 'Aucune'}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sales Chart */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary-500" />
                            Ventes mensuelles
                        </h3>
                        {productStats.monthlySales.length > 0 ? (
                            <div className="h-64">
                                <BarChartComponent
                                    data={productStats.monthlySales}
                                    dataKey="quantity"
                                    xAxisKey="name"
                                    color="#6366f1"
                                    showGrid
                                />
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-dark-500">
                                Aucune donnée de vente disponible
                            </div>
                        )}
                    </Card>
                </div>
            </motion.div>

            {/* Recent Sales */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    Dernières ventes incluant ce produit
                </h3>
                {salesData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-50 dark:bg-dark-800/50">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-dark-500">Date</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-dark-500">Vendeur</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-dark-500">Quantité</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-dark-500">Montant</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-dark-500">Total vente</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                                {salesData.map(sale => {
                                    const ligne = sale.lignes?.find(l => l.productId === parseInt(id))
                                    return (
                                        <tr key={sale.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/50">
                                            <td className="px-4 py-3 text-sm text-dark-900 dark:text-white">
                                                {formatDate(sale.saleDate)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-dark-600 dark:text-dark-400">
                                                {sale.username || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="primary">{ligne?.quantity || 0}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-success-600">
                                                {formatCurrency(ligne?.lineTotal || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-dark-900 dark:text-white">
                                                {formatCurrency(sale.totalAmount)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-dark-500">
                        Aucune vente enregistrée pour ce produit
                    </div>
                )}
            </Card>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Supprimer le produit"
                message={`Êtes-vous sûr de vouloir supprimer "${product.title}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
            />
        </div>
    )
}
