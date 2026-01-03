import { motion } from 'framer-motion'
import {
    ShoppingCart, Clock, Package, CheckCircle, XCircle,
    Truck, MapPin, Timer, AlertTriangle
} from 'lucide-react'

const ORDER_STEPS = {
    // Nouvelle commande (en attente de confirmation vendeur)
    PENDING: {
        step: 1,
        label: 'En attente',
        description: 'Votre commande est en attente de confirmation',
        icon: Clock,
        color: 'amber'
    },
    CREATED: {
        step: 1,
        label: 'Commande créée',
        description: 'Votre commande a été reçue',
        icon: ShoppingCart,
        color: 'primary'
    },
    // Confirmée par le vendeur
    CONFIRMED: {
        step: 2,
        label: 'Confirmée',
        description: 'Commande confirmée par le magasin',
        icon: CheckCircle,
        color: 'blue'
    },
    // En cours de préparation
    PROCESSING: {
        step: 3,
        label: 'En préparation',
        description: 'Votre commande est en cours de préparation',
        icon: Package,
        color: 'purple'
    },
    PENDING_PICKUP: {
        step: 3,
        label: 'En préparation',
        description: 'Votre commande est en cours de préparation',
        icon: Package,
        color: 'amber'
    },
    // Prête pour retrait
    READY_PICKUP: {
        step: 4,
        label: 'Prête à retirer',
        description: 'Venez récupérer votre commande',
        icon: MapPin,
        color: 'emerald'
    },
    READY: {
        step: 4,
        label: 'Prête',
        description: 'Votre commande est prête',
        icon: MapPin,
        color: 'emerald'
    },
    // Finalisée
    COMPLETED: {
        step: 5,
        label: 'Récupérée',
        description: 'Commande récupérée avec succès',
        icon: CheckCircle,
        color: 'success'
    },
    // Annulée par le client
    CANCELLED: {
        step: -1,
        label: 'Annulée',
        description: 'Cette commande a été annulée',
        icon: XCircle,
        color: 'danger'
    },
    // Rejetée par le vendeur
    REJECTED: {
        step: -2,
        label: 'Rejetée',
        description: 'Cette commande a été rejetée par le vendeur',
        icon: AlertTriangle,
        color: 'danger'
    }
}

const OrderTimeline = ({ status, pickupCode, estimatedTime, rejectionReason, className = '' }) => {
    const currentStep = ORDER_STEPS[status] || ORDER_STEPS.PENDING
    const isCancelled = status === 'CANCELLED'
    const isRejected = status === 'REJECTED'

    const steps = [
        { key: 'PENDING', label: 'En attente', icon: Clock, color: 'amber', step: 1 },
        { key: 'CONFIRMED', label: 'Confirmée', icon: CheckCircle, color: 'blue', step: 2 },
        { key: 'PROCESSING', label: 'En préparation', icon: Package, color: 'purple', step: 3 },
        { key: 'READY_PICKUP', label: 'Prête', icon: MapPin, color: 'emerald', step: 4 },
        { key: 'COMPLETED', label: 'Récupérée', icon: CheckCircle, color: 'success', step: 5 }
    ]

    const getStepStatus = (step) => {
        if (isCancelled || isRejected) return 'cancelled'
        if (step.step < currentStep.step) return 'completed'
        if (step.step === currentStep.step) return 'current'
        return 'pending'
    }

    const getStepStyles = (stepStatus, color) => {
        switch (stepStatus) {
            case 'completed':
                return {
                    circle: 'bg-emerald-500 text-white border-emerald-500',
                    line: 'bg-emerald-500',
                    text: 'text-emerald-600 dark:text-emerald-400',
                    label: 'text-dark-900 dark:text-white font-medium'
                }
            case 'current':
                return {
                    circle: `bg-${color}-500 text-white border-${color}-500 ring-4 ring-${color}-100 dark:ring-${color}-900/50`,
                    line: 'bg-dark-200 dark:bg-dark-600',
                    text: `text-${color}-600 dark:text-${color}-400`,
                    label: 'text-dark-900 dark:text-white font-semibold'
                }
            case 'cancelled':
                return {
                    circle: 'bg-red-500 text-white border-red-500',
                    line: 'bg-red-200 dark:bg-red-900/30',
                    text: 'text-red-500',
                    label: 'text-red-600 dark:text-red-400 font-medium'
                }
            default:
                return {
                    circle: 'bg-dark-100 dark:bg-dark-700 text-dark-400 border-dark-200 dark:border-dark-600',
                    line: 'bg-dark-200 dark:bg-dark-600',
                    text: 'text-dark-400',
                    label: 'text-dark-500'
                }
        }
    }

    if (isCancelled) {
        return (
            <div className={`p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 ${className}`}>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                            Commande annulée
                        </h3>
                        <p className="text-red-500 dark:text-red-400/70">
                            Cette commande a été annulée
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (isRejected) {
        return (
            <div className={`p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 ${className}`}>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                            Commande rejetée
                        </h3>
                        <p className="text-red-500 dark:text-red-400/70">
                            {rejectionReason || 'Cette commande a été rejetée par le vendeur'}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`bg-white dark:bg-dark-800 rounded-2xl p-6 ${className}`}>
            {/* Header avec code de retrait si prêt */}
            {status === 'READY_PICKUP' && pickupCode && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 text-sm">Code de retrait</p>
                            <p className="text-3xl font-mono font-bold tracking-wider">
                                {pickupCode}
                            </p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                            <MapPin className="w-8 h-8" />
                        </div>
                    </div>
                    <p className="text-emerald-100 text-sm mt-2">
                        Présentez ce code au vendeur pour récupérer votre commande
                    </p>
                </motion.div>
            )}

            {/* Temps estimé si en attente */}
            {['CREATED', 'CONFIRMED', 'PROCESSING'].includes(status) && estimatedTime && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3">
                        <Timer className="w-6 h-6 text-amber-500" />
                        <div>
                            <p className="text-sm text-amber-600 dark:text-amber-400">Temps estimé</p>
                            <p className="font-semibold text-amber-700 dark:text-amber-300">
                                {estimatedTime}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="relative">
                {steps.map((step, index) => {
                    const stepStatus = getStepStatus(step)
                    const styles = getStepStyles(stepStatus, step.color)
                    const Icon = step.icon
                    const isLast = index === steps.length - 1

                    return (
                        <div key={step.key} className="relative flex gap-4">
                            {/* Ligne verticale */}
                            {!isLast && (
                                <div
                                    className={`absolute left-6 top-12 w-0.5 h-full -ml-px ${styles.line}`}
                                />
                            )}

                            {/* Cercle avec icône */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative z-10 w-12 h-12 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${styles.circle}`}
                            >
                                <Icon className="w-6 h-6" />
                            </motion.div>

                            {/* Contenu */}
                            <motion.div
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1 + 0.05 }}
                                className={`pb-8 ${isLast ? 'pb-0' : ''}`}
                            >
                                <p className={`text-base ${styles.label}`}>
                                    {step.label}
                                </p>
                                <p className={`text-sm mt-0.5 ${styles.text}`}>
                                    {stepStatus === 'current' ? step.description || ORDER_STEPS[step.key]?.description : ''}
                                    {stepStatus === 'completed' && '✓'}
                                </p>

                                {/* Badge statut actuel */}
                                {stepStatus === 'current' && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium bg-${step.color}-100 dark:bg-${step.color}-900/30 text-${step.color}-600 dark:text-${step.color}-400`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                        En cours
                                    </motion.span>
                                )}
                            </motion.div>
                        </div>
                    )
                })}
            </div>

            {/* Commande terminée */}
            {status === 'COMPLETED' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800"
                >
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                        <div>
                            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                                Commande récupérée avec succès !
                            </p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-500">
                                Merci pour votre achat
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export default OrderTimeline
