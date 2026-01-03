import { Star, Gift, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

const tierConfig = {
    BRONZE: {
        color: 'from-amber-600 to-amber-800',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        icon: '🥉',
    },
    SILVER: {
        color: 'from-gray-400 to-gray-600',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        icon: '🥈',
    },
    GOLD: {
        color: 'from-yellow-400 to-yellow-600',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        icon: '🥇',
    },
    PLATINUM: {
        color: 'from-purple-400 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        icon: '💎',
    },
}

export default function LoyaltyCard({ loyaltyInfo, compact = false }) {
    const tier = loyaltyInfo?.loyaltyTier || 'BRONZE'
    const config = tierConfig[tier] || tierConfig.BRONZE
    const points = loyaltyInfo?.currentPoints || 0
    const pointsToNext = loyaltyInfo?.pointsToNextTier || 0
    const nextTier = getNextTier(tier)

    // Calculer le pourcentage de progression
    const progressPercent = nextTier
        ? Math.min(100, ((getMinPointsForTier(nextTier) - pointsToNext) / getMinPointsForTier(nextTier)) * 100)
        : 100

    if (compact) {
        return (
            <div className={`flex items-center gap-3 p-3 rounded-xl ${config.bgColor}`}>
                <span className="text-2xl">{config.icon}</span>
                <div>
                    <p className="text-sm font-medium text-gray-900">{tier}</p>
                    <p className="text-xs text-gray-500">{points} points</p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
            {/* Header gradient */}
            <div className={`bg-gradient-to-r ${config.color} p-6 text-white`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">{config.icon}</span>
                        <div>
                            <p className="text-sm opacity-80">Niveau</p>
                            <h3 className="text-2xl font-bold">{tier}</h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm opacity-80">Vos points</p>
                        <p className="text-3xl font-bold">{points}</p>
                    </div>
                </div>
            </div>

            {/* Progress to next tier */}
            {nextTier && (
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            Progression vers {nextTier}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                            {pointsToNext} points restants
                        </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full bg-gradient-to-r ${config.color} rounded-full`}
                        />
                    </div>
                </div>
            )}

            {/* Benefits */}
            <div className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-emerald-600" />
                    Avantages {tier}
                </h4>
                <ul className="space-y-2">
                    {getTierBenefits(tier).map((benefit, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <Star className="w-4 h-4 text-amber-500" />
                            {benefit}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Recent activity */}
            {loyaltyInfo?.recentActivity?.length > 0 && (
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3">Activité récente</h4>
                    <div className="space-y-2">
                        {loyaltyInfo.recentActivity.slice(0, 3).map((activity, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{activity.description}</span>
                                <span className="font-medium text-emerald-600">
                                    +{activity.pointsChange} pts
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    )
}

function getNextTier(currentTier) {
    const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']
    const currentIndex = tiers.indexOf(currentTier)
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null
}

function getMinPointsForTier(tier) {
    const thresholds = {
        BRONZE: 0,
        SILVER: 1000,
        GOLD: 5000,
        PLATINUM: 10000,
    }
    return thresholds[tier] || 0
}

function getTierBenefits(tier) {
    const benefits = {
        BRONZE: [
            'Accès au programme fidélité',
            '1 point par MAD dépensé',
            'Offres exclusives par email',
        ],
        SILVER: [
            'Tous les avantages Bronze',
            '1.5 points par MAD dépensé',
            'Accès anticipé aux promotions',
            'Livraison prioritaire',
        ],
        GOLD: [
            'Tous les avantages Silver',
            '2 points par MAD dépensé',
            'Service client prioritaire',
            '-10% sur une commande par mois',
        ],
        PLATINUM: [
            'Tous les avantages Gold',
            '3 points par MAD dépensé',
            'Invitations événements VIP',
            '-15% sur toutes les commandes',
            'Cadeaux exclusifs',
        ],
    }
    return benefits[tier] || benefits.BRONZE
}
