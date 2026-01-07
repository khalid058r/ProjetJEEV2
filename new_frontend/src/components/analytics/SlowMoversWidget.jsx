import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, ArrowRight, Clock } from 'lucide-react'
import { analyticsApi } from '../../api'
import { Card, EmptyState, Loading, Badge } from '../../components/ui'
import { formatCurrency } from '../../utils/formatters'

export default function SlowMoversWidget() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSlowMovers()
    }, [])

    const fetchSlowMovers = async () => {
        try {
            setLoading(true)
            // Get products with less than 5 sales
            const response = await analyticsApi.getSlowMovers(5, 5)
            setProducts(response.data || [])
        } catch (error) {
            console.error('Error fetching slow movers:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Card className="p-6 h-full"><Loading /></Card>

    return (
        <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-dark-900 dark:text-white">
                            Stocks Dormants
                        </h3>
                        <p className="text-sm text-dark-500">Produits à faible rotation</p>
                    </div>
                </div>
                <Badge variant="warning">
                    Action requise
                </Badge>
            </div>

            {products.length > 0 ? (
                <div className="space-y-4">
                    {products.map((product, index) => (
                        <motion.div
                            key={product.id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-4 p-3 rounded-xl bg-dark-50 dark:bg-dark-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-lg bg-white dark:bg-dark-700 flex-shrink-0 overflow-hidden border border-gray-100 dark:border-dark-600">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-5 h-5 text-dark-400" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-dark-900 dark:text-white truncate" title={product.title}>
                                    {product.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-dark-500">
                                        Stock: <span className="font-medium text-dark-900 dark:text-dark-200">{product.stock}</span>
                                    </span>
                                    <span className="text-xs text-dark-500">
                                        Vendus: <span className="font-medium text-dark-900 dark:text-dark-200">{product.totalSold || 0}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="font-medium text-orange-600 dark:text-orange-400">
                                    {formatCurrency(product.price)}
                                </p>
                                <button className="text-xs font-medium text-primary-600 hover:text-primary-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Créer promo
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    <button className="w-full py-2 mt-2 text-sm font-medium text-dark-500 hover:text-orange-600 flex items-center justify-center gap-2 transition-colors">
                        Voir tous les produits dormants
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <EmptyState
                    icon={Package}
                    title="Aucun stock dormant"
                    description="Vos produits se vendent bien !"
                />
            )}
        </Card>
    )
}
