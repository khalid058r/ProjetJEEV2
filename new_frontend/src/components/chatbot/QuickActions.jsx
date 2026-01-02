import { motion } from 'framer-motion'
import {
    Search,
    TrendingUp,
    Package,
    AlertTriangle,
    BarChart2,
    Users,
    ShoppingCart,
    PieChart
} from 'lucide-react'

const QuickActions = ({ suggestions, onSuggestionClick }) => {
    // Map suggestions to icons
    const getIcon = (suggestion) => {
        const lowerSuggestion = suggestion.toLowerCase()

        if (lowerSuggestion.includes('recherch') || lowerSuggestion.includes('cherch')) {
            return <Search className="w-4 h-4" />
        }
        if (lowerSuggestion.includes('statistique') || lowerSuggestion.includes('stats')) {
            return <BarChart2 className="w-4 h-4" />
        }
        if (lowerSuggestion.includes('vendeur') || lowerSuggestion.includes('performance')) {
            return <Users className="w-4 h-4" />
        }
        if (lowerSuggestion.includes('alerte') || lowerSuggestion.includes('stock')) {
            return <AlertTriangle className="w-4 h-4" />
        }
        if (lowerSuggestion.includes('produit') || lowerSuggestion.includes('populaire')) {
            return <Package className="w-4 h-4" />
        }
        if (lowerSuggestion.includes('vente') || lowerSuggestion.includes('chiffre')) {
            return <ShoppingCart className="w-4 h-4" />
        }
        if (lowerSuggestion.includes('tendance') || lowerSuggestion.includes('analyse')) {
            return <TrendingUp className="w-4 h-4" />
        }
        if (lowerSuggestion.includes('categorie')) {
            return <PieChart className="w-4 h-4" />
        }

        return <Search className="w-4 h-4" />
    }

    // Get gradient color based on index
    const getGradient = (index) => {
        const gradients = [
            'from-blue-500 to-cyan-500',
            'from-purple-500 to-pink-500',
            'from-green-500 to-emerald-500',
            'from-orange-500 to-yellow-500',
            'from-indigo-500 to-violet-500'
        ]
        return gradients[index % gradients.length]
    }

    return (
        <div className="px-4 pb-2 bg-gray-50 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Suggestions rapides :
            </p>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                    <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSuggestionClick(suggestion)}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-medium text-white rounded-full bg-gradient-to-r ${getGradient(index)} hover:shadow-md transition-shadow`}
                    >
                        {getIcon(suggestion)}
                        <span>{suggestion.replace(/[^\w\s]/g, '').trim()}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    )
}

export default QuickActions
