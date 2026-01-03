import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Search, Filter, X, ChevronDown, Grid3X3, List,
    SlidersHorizontal
} from 'lucide-react'
import { shopApi } from '../../api'
import { ProductGrid } from '../../components/shop'

export default function Catalog() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [viewMode, setViewMode] = useState('grid')

    // Filters
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        inStock: searchParams.get('inStock') === 'true',
        sort: searchParams.get('sort') || 'name',
    })

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const params = {}

            if (filters.search) params.search = filters.search
            if (filters.category) params.categoryId = filters.category
            if (filters.minPrice) params.minPrice = filters.minPrice
            if (filters.maxPrice) params.maxPrice = filters.maxPrice
            if (filters.inStock) params.inStock = true
            if (filters.sort) params.sort = filters.sort

            const [productsRes, categoriesRes] = await Promise.all([
                shopApi.getProducts(params),
                shopApi.getCategories(),
            ])

            setProducts(productsRes.data?.content || productsRes.data || [])
            setCategories(categoriesRes.data || [])
        } catch (error) {
            console.error('Error loading catalog:', error)
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Update URL params when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '' && value !== false) {
                params.set(key, value.toString())
            }
        })
        setSearchParams(params, { replace: true })
    }, [filters, setSearchParams])

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            category: '',
            minPrice: '',
            maxPrice: '',
            inStock: false,
            sort: 'name',
        })
    }

    const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice || filters.inStock

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                            {/* Filter toggle (mobile) */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`
                                    lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors
                                    ${showFilters || hasActiveFilters
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-gray-100 text-gray-700'}
                                `}
                            >
                                <SlidersHorizontal className="w-5 h-5" />
                                Filtres
                                {hasActiveFilters && (
                                    <span className="w-2 h-2 bg-emerald-600 rounded-full" />
                                )}
                            </button>

                            {/* Category filter (desktop) */}
                            <div className="hidden lg:block relative">
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="appearance-none px-4 py-2.5 pr-10 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    <option value="">Toutes catégories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>

                            {/* Sort */}
                            <div className="relative">
                                <select
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    className="appearance-none px-4 py-2.5 pr-10 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    <option value="name">Nom A-Z</option>
                                    <option value="-name">Nom Z-A</option>
                                    <option value="price">Prix croissant</option>
                                    <option value="-price">Prix décroissant</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>

                            {/* View mode */}
                            <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''
                                        }`}
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''
                                        }`}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile filters panel */}
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="lg:hidden mt-4 pt-4 border-t border-gray-200"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Catégorie
                                    </label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Toutes</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prix min
                                    </label>
                                    <input
                                        type="number"
                                        value={filters.minPrice}
                                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prix max
                                    </label>
                                    <input
                                        type="number"
                                        value={filters.maxPrice}
                                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                        placeholder="9999"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.inStock}
                                            onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-700">En stock uniquement</span>
                                    </label>
                                </div>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 text-sm text-red-600 hover:text-red-700"
                                >
                                    Effacer les filtres
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* Active filters badges */}
                    {hasActiveFilters && (
                        <div className="hidden lg:flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-500">Filtres actifs:</span>
                            {filters.category && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                                    {categories.find(c => c.id.toString() === filters.category)?.name}
                                    <button onClick={() => handleFilterChange('category', '')}>
                                        <X className="w-4 h-4" />
                                    </button>
                                </span>
                            )}
                            {(filters.minPrice || filters.maxPrice) && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                                    Prix: {filters.minPrice || '0'} - {filters.maxPrice || '∞'} MAD
                                    <button onClick={() => {
                                        handleFilterChange('minPrice', '')
                                        handleFilterChange('maxPrice', '')
                                    }}>
                                        <X className="w-4 h-4" />
                                    </button>
                                </span>
                            )}
                            {filters.inStock && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                                    En stock
                                    <button onClick={() => handleFilterChange('inStock', false)}>
                                        <X className="w-4 h-4" />
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={clearFilters}
                                className="text-sm text-red-600 hover:text-red-700 ml-2"
                            >
                                Tout effacer
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results count */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600">
                        {loading ? 'Chargement...' : `${products.length} produit(s) trouvé(s)`}
                    </p>
                </div>

                {/* Products */}
                <ProductGrid products={products} loading={loading} />
            </div>
        </div>
    )
}
