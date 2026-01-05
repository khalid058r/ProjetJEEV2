import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles, ShoppingBag, TrendingUp, Layers,
    ExternalLink, Star, DollarSign, Loader2, AlertCircle
} from 'lucide-react'
import { recommendationsApi, productApi } from '../../api'
import { Card, Button, Badge } from '../ui'
import { formatCurrency } from '../../utils/formatters'

/**
 * Composant d'affichage des recommandations de produits
 * Utilise l'API ML Python pour les recommandations intelligentes
 */
export default function ProductRecommendations({ productId, showTitle = true }) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [recommendations, setRecommendations] = useState({
        similar: [],
        upsell: [],
        crossSell: []
    })
    const [activeTab, setActiveTab] = useState('similar')

    useEffect(() => {
        if (productId) {
            fetchRecommendations()
        }
    }, [productId])

    const fetchRecommendations = async () => {
        try {
            setLoading(true)
            setError(null)

            // Appeler l'API de recommandations
            const res = await recommendationsApi.getAll(productId, 6)

            // Extraire les recommandations
            const data = res.data

            setRecommendations({
                similar: data.similar?.similar_products || [],
                upsell: data.upsell?.upsell_options || [],
                crossSell: data.crossSell?.crosssell_products || []
            })

        } catch (err) {
            console.error('Erreur chargement recommandations:', err)
            setError('Impossible de charger les recommandations')

            // Essayer de charger des produits de fallback
            try {
                const productsRes = await productApi.getAll({ limit: 6 })
                const products = productsRes.data?.content || productsRes.data || []
                setRecommendations({
                    similar: products.filter(p => p.id !== parseInt(productId)).slice(0, 6),
                    upsell: [],
                    crossSell: []
                })
            } catch {
                // Ignorer l'erreur de fallback
            }
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        {
            id: 'similar',
            label: 'Similaires',
            icon: Layers,
            description: 'Produits de la même catégorie',
            data: recommendations.similar
        },
        {
            id: 'upsell',
            label: 'Premium',
            icon: TrendingUp,
            description: 'Alternatives de meilleure qualité',
            data: recommendations.upsell
        },
        {
            id: 'crossSell',
            label: 'Complémentaires',
            icon: ShoppingBag,
            description: 'Produits souvent achetés ensemble',
            data: recommendations.crossSell
        }
    ]

    const currentTab = tabs.find(t => t.id === activeTab)
    const currentProducts = currentTab?.data || []

    const handleProductClick = (product) => {
        navigate(`/analyst/products/${product.id}`)
    }

    if (loading) {
        return (
            <Card>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    <span className="ml-3 text-dark-500">Chargement des recommandations ML...</span>
                </div>
            </Card>
        )
    }

    const hasAnyRecommendations = recommendations.similar.length > 0 ||
        recommendations.upsell.length > 0 ||
        recommendations.crossSell.length > 0

    if (!hasAnyRecommendations) {
        return (
            <Card>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-dark-300 mb-3" />
                    <p className="text-dark-500 mb-2">Aucune recommandation disponible</p>
                    <p className="text-sm text-dark-400">
                        Le service ML n'a pas trouvé de produits similaires
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={fetchRecommendations}>
                        Réessayer
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <Card>
            {/* Header */}
            {showTitle && (
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-dark-900 dark:text-white">
                            Recommandations Intelligentes
                        </h3>
                        <p className="text-sm text-dark-500">
                            Propulsées par Machine Learning
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    const count = tab.data.length

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            disabled={count === 0}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                                whitespace-nowrap
                                ${isActive
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                    : count === 0
                                        ? 'bg-dark-100 dark:bg-dark-800 text-dark-400 cursor-not-allowed'
                                        : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700'
                                }
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            {count > 0 && (
                                <span className={`
                                    text-xs px-2 py-0.5 rounded-full
                                    ${isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-dark-200 dark:bg-dark-700 text-dark-500'
                                    }
                                `}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tab Description */}
            {currentTab && (
                <p className="text-sm text-dark-500 mb-4">
                    {currentTab.description}
                </p>
            )}

            {/* Products Grid */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {currentProducts.map((product, index) => (
                        <motion.div
                            key={product.id || index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleProductClick(product)}
                            className="group cursor-pointer"
                        >
                            <div className="p-4 border border-dark-200 dark:border-dark-700 rounded-lg 
                                          hover:border-primary-300 dark:hover:border-primary-700 
                                          hover:shadow-md transition-all bg-white dark:bg-dark-800">
                                {/* Product Image Placeholder */}
                                <div className="w-full h-32 bg-gradient-to-br from-dark-100 to-dark-200 
                                              dark:from-dark-700 dark:to-dark-800 rounded-lg mb-3 
                                              flex items-center justify-center overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name || product.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <ShoppingBag className="w-8 h-8 text-dark-400" />
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-dark-900 dark:text-white 
                                                 line-clamp-2 group-hover:text-primary-500 transition-colors">
                                        {product.name || product.title || `Produit ${product.id}`}
                                    </h4>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="w-4 h-4 text-secondary-500" />
                                            <span className="font-semibold text-dark-900 dark:text-white">
                                                {formatCurrency(product.price)}
                                            </span>
                                        </div>

                                        {product.rating && (
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                                                <span className="text-sm text-dark-500">
                                                    {product.rating.toFixed(1)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Similarity Score for similar products */}
                                    {product.similarity_score && (
                                        <Badge variant="secondary" className="text-xs">
                                            {(product.similarity_score * 100).toFixed(0)}% similaire
                                        </Badge>
                                    )}

                                    {/* Price Difference for upsell */}
                                    {activeTab === 'upsell' && product.price_diff && (
                                        <Badge variant="success" className="text-xs">
                                            +{formatCurrency(product.price_diff)} (meilleur)
                                        </Badge>
                                    )}

                                    {/* Category for cross-sell */}
                                    {activeTab === 'crossSell' && (product.category || product.categoryName) && (
                                        <Badge variant="info" className="text-xs">
                                            {product.category?.name || product.categoryName}
                                        </Badge>
                                    )}
                                </div>

                                {/* View Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Voir détails
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* Empty State for Current Tab */}
            {currentProducts.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-dark-500">
                        Aucune recommandation de type "{currentTab?.label}" disponible
                    </p>
                </div>
            )}
        </Card>
    )
}
