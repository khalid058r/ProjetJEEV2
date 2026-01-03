import { Package, Clock, CheckCircle, Truck, XCircle, AlertCircle, AlertTriangle } from 'lucide-react'

const statusConfig = {
    // Nouvelle commande (en attente de confirmation)
    PENDING: {
        label: 'En attente',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Clock,
    },
    CREATED: {
        label: 'Créée',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: Package,
    },
    // Confirmée par le vendeur
    CONFIRMED: {
        label: 'Confirmée',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        icon: CheckCircle,
    },
    // En préparation
    PENDING_PICKUP: {
        label: 'En préparation',
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: Clock,
    },
    PROCESSING: {
        label: 'En préparation',
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: Package,
    },
    // Prête pour retrait
    READY_PICKUP: {
        label: 'Prête à récupérer',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: Truck,
    },
    READY: {
        label: 'Prête',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: Truck,
    },
    // Finalisée
    COMPLETED: {
        label: 'Récupérée',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle,
    },
    // Annulée par le client
    CANCELLED: {
        label: 'Annulée',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle,
    },
    // Rejetée par le vendeur
    REJECTED: {
        label: 'Rejetée',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertTriangle,
    },
}

export default function OrderStatusBadge({ status, size = 'md' }) {
    const config = statusConfig[status] || {
        label: status,
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: AlertCircle,
    }

    const Icon = config.icon

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base',
    }

    return (
        <span className={`
            inline-flex items-center gap-1.5 font-medium rounded-full border
            ${config.color} ${sizeClasses[size]}
        `}>
            <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
            {config.label}
        </span>
    )
}

// Timeline component for order tracking
export function OrderTimeline({ status }) {
    const steps = [
        { status: 'CONFIRMED', label: 'Confirmée' },
        { status: 'PENDING_PICKUP', label: 'En préparation' },
        { status: 'READY_PICKUP', label: 'Prête' },
        { status: 'COMPLETED', label: 'Récupérée' },
    ]

    const currentIndex = steps.findIndex(s => s.status === status)
    const isCancelled = status === 'CANCELLED'

    if (isCancelled) {
        return (
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-xl">
                <XCircle className="w-6 h-6 text-red-500 mr-2" />
                <span className="text-red-700 font-medium">Commande annulée</span>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between">
            {steps.map((step, index) => {
                const isCompleted = index <= currentIndex
                const isCurrent = index === currentIndex

                return (
                    <div key={step.status} className="flex-1 flex items-center">
                        <div className="flex flex-col items-center flex-1">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center
                                ${isCompleted
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-200 text-gray-400'}
                                ${isCurrent ? 'ring-4 ring-emerald-200' : ''}
                            `}>
                                {isCompleted ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <span className="text-sm font-medium">{index + 1}</span>
                                )}
                            </div>
                            <span className={`
                                mt-2 text-xs font-medium text-center
                                ${isCompleted ? 'text-emerald-600' : 'text-gray-400'}
                            `}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`
                                flex-1 h-1 mx-2
                                ${index < currentIndex ? 'bg-emerald-600' : 'bg-gray-200'}
                            `} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
