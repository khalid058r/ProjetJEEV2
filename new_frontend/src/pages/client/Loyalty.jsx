import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Award, Star, Gift, TrendingUp, Crown, ShoppingBag,
    Calendar, ChevronRight
} from 'lucide-react'
import { customerApi } from '../../api'
import { LoyaltyCard } from '../../components/shop'

export default function Loyalty() {
    const [loyalty, setLoyalty] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadLoyalty()
    }, [])

    const loadLoyalty = async () => {
        try {
            setLoading(true)
            const response = await customerApi.getLoyaltyInfo()
            setLoyalty(response.data)
        } catch (error) {
            console.error('Error loading loyalty:', error)
        } finally {
            setLoading(false)
        }
    }

    const rewards = [
        {
            points: 500,
            title: '5% de réduction',
            description: 'Sur votre prochaine commande',
            icon: Gift,
            available: loyalty?.totalPoints >= 500
        },
        {
            points: 1000,
            title: '10% de réduction',
            description: 'Sur votre prochaine commande',
            icon: Gift,
            available: loyalty?.totalPoints >= 1000
        },
        {
            points: 2000,
            title: 'Produit gratuit',
            description: "Choisissez parmi une sélection",
            icon: ShoppingBag,
            available: loyalty?.totalPoints >= 2000
        },
        {
            points: 5000,
            title: 'Livraison VIP',
            description: 'Priorité pendant 6 mois',
            icon: Crown,
            available: loyalty?.totalPoints >= 5000
        }
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4" />
                        <div className="h-48 bg-gray-200 rounded-2xl" />
                        <div className="h-60 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                        Programme Fidélité
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Cumulez des points et profitez d'avantages exclusifs
                    </p>
                </div>

                {/* Loyalty card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <LoyaltyCard
                        loyalty={loyalty}
                        showDetails={true}
                    />
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid sm:grid-cols-3 gap-4 mb-8"
                >
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Star className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-sm text-gray-500">Total points</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {loyalty?.totalPoints || 0}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="text-sm text-gray-500">Commandes</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {loyalty?.totalOrders || 0}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-amber-600" />
                            </div>
                            <span className="text-sm text-gray-500">Total dépensé</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {(loyalty?.totalSpent || 0).toFixed(0)} MAD
                        </p>
                    </div>
                </motion.div>

                {/* Rewards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-sm p-6 mb-8"
                >
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                        Récompenses disponibles
                    </h2>

                    <div className="space-y-4">
                        {rewards.map((reward, index) => {
                            const Icon = reward.icon
                            return (
                                <div
                                    key={index}
                                    className={`
                                        flex items-center gap-4 p-4 rounded-xl border-2 transition-colors
                                        ${reward.available
                                            ? 'border-emerald-200 bg-emerald-50'
                                            : 'border-gray-200 bg-gray-50 opacity-60'
                                        }
                                    `}
                                >
                                    <div className={`
                                        p-3 rounded-xl
                                        ${reward.available ? 'bg-emerald-600' : 'bg-gray-400'}
                                    `}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {reward.title}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {reward.description}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`
                                            font-bold
                                            ${reward.available ? 'text-emerald-600' : 'text-gray-400'}
                                        `}>
                                            {reward.points} pts
                                        </p>
                                        {reward.available && (
                                            <span className="text-xs text-emerald-600">
                                                Disponible
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* How it works */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white"
                >
                    <h2 className="text-lg font-semibold mb-4">
                        Comment ça marche ?
                    </h2>
                    <div className="grid sm:grid-cols-3 gap-6">
                        <div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <p className="font-medium mb-1">Achetez</p>
                            <p className="text-sm opacity-80">
                                Gagnez 1 point pour chaque 10 MAD dépensés
                            </p>
                        </div>
                        <div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <p className="font-medium mb-1">Cumulez</p>
                            <p className="text-sm opacity-80">
                                Plus vous achetez, plus vous montez en niveau
                            </p>
                        </div>
                        <div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                                <Gift className="w-5 h-5" />
                            </div>
                            <p className="font-medium mb-1">Profitez</p>
                            <p className="text-sm opacity-80">
                                Échangez vos points contre des récompenses
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
