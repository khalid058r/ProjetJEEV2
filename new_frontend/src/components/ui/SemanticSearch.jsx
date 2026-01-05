import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Brain, Loader2, X, Star, DollarSign,
    TrendingUp, Clock, Sparkles, ArrowRight
} from 'lucide-react'
import { searchApi, productApi } from '../../api'
import { formatCurrency } from '../../utils/formatters'
import debounce from 'lodash/debounce'

/**
 * Composant de recherche sémantique
 * Utilise l'API ML Python pour la recherche intelligente
 */
export default function SemanticSearch({
    placeholder = "Rechercher des produits avec l'IA...",
    onResultSelect,
    className = ''
}) {
    const navigate = useNavigate()
    const inputRef = useRef(null)
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState([])
    const [recentSearches, setRecentSearches] = useState([])
    const [searchMode, setSearchMode] = useState('semantic') // 'semantic' | 'classic'
    const [error, setError] = useState(null)

    useEffect(() => {
        // Charger les recherches récentes depuis localStorage
        const saved = localStorage.getItem('recentSearches')
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved))
            } catch {
                // Ignorer les erreurs de parsing
            }
        }
    }, [])

    const saveRecentSearch = (searchQuery) => {
        const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
        setRecentSearches(updated)
        localStorage.setItem('recentSearches', JSON.stringify(updated))
    }

    // Recherche sémantique avec debounce
    const performSemanticSearch = useCallback(
        debounce(async (searchQuery) => {
            if (!searchQuery || searchQuery.length < 2) {
                setResults([])
                setLoading(false)
                return
            }

            setLoading(true)
            setError(null)

            try {
                if (searchMode === 'semantic') {
                    // Recherche sémantique via Python ML
                    const result = await searchApi.semantic(searchQuery, 10)

                    if (result.results && result.results.length > 0) {
                        // Enrichir avec les détails des produits
                        const enrichedResults = result.results.map(r => ({
                            id: r.product_id,
                            title: r.title || `Produit ${r.product_id}`,
                            score: r.score,
                            semantic: true
                        }))
                        setResults(enrichedResults)
                    } else {
                        // Fallback vers recherche classique
                        await performClassicSearch(searchQuery)
                    }
                } else {
                    await performClassicSearch(searchQuery)
                }
            } catch (err) {
                console.error('Erreur recherche sémantique:', err)
                // Fallback vers recherche classique
                await performClassicSearch(searchQuery)
            } finally {
                setLoading(false)
            }
        }, 300),
        [searchMode]
    )

    const performClassicSearch = async (searchQuery) => {
        try {
            const res = await productApi.search(searchQuery)
            const products = res.data?.content || res.data || []
            setResults(products.slice(0, 10).map(p => ({
                ...p,
                semantic: false
            })))
        } catch (err) {
            console.error('Erreur recherche classique:', err)
            setError('Erreur de recherche')
            setResults([])
        }
    }

    const handleInputChange = (e) => {
        const value = e.target.value
        setQuery(value)
        performSemanticSearch(value)
    }

    const handleResultClick = (result) => {
        saveRecentSearch(query)
        setIsOpen(false)
        setQuery('')

        if (onResultSelect) {
            onResultSelect(result)
        } else {
            navigate(`/analyst/products/${result.id}`)
        }
    }

    const handleRecentSearchClick = (searchQuery) => {
        setQuery(searchQuery)
        performSemanticSearch(searchQuery)
    }

    const clearRecentSearches = () => {
        setRecentSearches([])
        localStorage.removeItem('recentSearches')
    }

    return (
        <div className={`relative ${className}`}>
            {/* Search Input */}
            <div className={`
                relative flex items-center gap-2 
                bg-white dark:bg-dark-800 
                border border-dark-200 dark:border-dark-700 
                rounded-xl px-4 py-3 
                transition-all duration-200
                ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : 'hover:border-dark-300 dark:hover:border-dark-600'}
            `}>
                {loading ? (
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                ) : (
                    <Search className="w-5 h-5 text-dark-400" />
                )}

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent border-none outline-none text-dark-900 dark:text-white placeholder-dark-400"
                />

                {/* Search Mode Toggle */}
                <button
                    onClick={() => setSearchMode(prev => prev === 'semantic' ? 'classic' : 'semantic')}
                    className={`
                        p-1.5 rounded-lg transition-colors
                        ${searchMode === 'semantic'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-dark-100 dark:bg-dark-700 text-dark-500'
                        }
                    `}
                    title={searchMode === 'semantic' ? 'Recherche IA active' : 'Recherche classique'}
                >
                    {searchMode === 'semantic' ? (
                        <Brain className="w-4 h-4" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </button>

                {query && (
                    <button
                        onClick={() => {
                            setQuery('')
                            setResults([])
                            inputRef.current?.focus()
                        }}
                        className="p-1 hover:bg-dark-100 dark:hover:bg-dark-700 rounded"
                    >
                        <X className="w-4 h-4 text-dark-400" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 z-50
                                 bg-white dark:bg-dark-800 
                                 border border-dark-200 dark:border-dark-700 
                                 rounded-xl shadow-xl overflow-hidden"
                    >
                        {/* Search Mode Indicator */}
                        <div className="px-4 py-2 bg-dark-50 dark:bg-dark-900 border-b border-dark-200 dark:border-dark-700">
                            <div className="flex items-center gap-2 text-xs">
                                {searchMode === 'semantic' ? (
                                    <>
                                        <Sparkles className="w-3 h-3 text-purple-500" />
                                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                                            Recherche Sémantique IA
                                        </span>
                                        <span className="text-dark-400">
                                            - Comprend le sens de votre recherche
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-3 h-3 text-dark-400" />
                                        <span className="text-dark-600 dark:text-dark-400 font-medium">
                                            Recherche Classique
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="px-4 py-3 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20">
                                {error}
                            </div>
                        )}

                        {/* Results */}
                        {results.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto">
                                {results.map((result, index) => (
                                    <motion.div
                                        key={result.id || index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        onClick={() => handleResultClick(result)}
                                        className="flex items-center gap-3 px-4 py-3 cursor-pointer
                                                 hover:bg-dark-50 dark:hover:bg-dark-700 
                                                 border-b border-dark-100 dark:border-dark-700 last:border-0"
                                    >
                                        {/* Product Image Placeholder */}
                                        <div className="w-10 h-10 rounded-lg bg-dark-100 dark:bg-dark-700 
                                                      flex items-center justify-center flex-shrink-0">
                                            {result.imageUrl ? (
                                                <img
                                                    src={result.imageUrl}
                                                    alt=""
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <TrendingUp className="w-4 h-4 text-dark-400" />
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-dark-900 dark:text-white truncate">
                                                {result.name || result.title || `Produit ${result.id}`}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm">
                                                {result.price && (
                                                    <span className="text-secondary-600 dark:text-secondary-400 font-medium">
                                                        {formatCurrency(result.price)}
                                                    </span>
                                                )}
                                                {result.rating && (
                                                    <span className="flex items-center gap-1 text-dark-500">
                                                        <Star className="w-3 h-3 fill-warning-500 text-warning-500" />
                                                        {result.rating.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Semantic Score */}
                                        {result.semantic && result.score && (
                                            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                                                <Brain className="w-3 h-3" />
                                                {(result.score * 100).toFixed(0)}%
                                            </div>
                                        )}

                                        <ArrowRight className="w-4 h-4 text-dark-400" />
                                    </motion.div>
                                ))}
                            </div>
                        ) : query.length >= 2 && !loading ? (
                            <div className="px-4 py-8 text-center text-dark-500">
                                <Search className="w-8 h-8 mx-auto mb-2 text-dark-300" />
                                <p>Aucun résultat pour "{query}"</p>
                            </div>
                        ) : (
                            /* Recent Searches */
                            recentSearches.length > 0 && (
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-medium text-dark-500 uppercase">
                                            Recherches récentes
                                        </span>
                                        <button
                                            onClick={clearRecentSearches}
                                            className="text-xs text-dark-400 hover:text-dark-600 dark:hover:text-dark-300"
                                        >
                                            Effacer
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        {recentSearches.map((search, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleRecentSearchClick(search)}
                                                className="flex items-center gap-2 w-full px-3 py-2 
                                                         text-left text-sm text-dark-600 dark:text-dark-400
                                                         hover:bg-dark-50 dark:hover:bg-dark-700 rounded-lg"
                                            >
                                                <Clock className="w-4 h-4 text-dark-400" />
                                                {search}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
