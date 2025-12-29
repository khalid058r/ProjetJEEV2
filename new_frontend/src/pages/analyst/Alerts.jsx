import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Bell, BellRing, Plus, Trash2, Edit2, Check, X, AlertTriangle,
    TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart,
    Settings, ToggleLeft, ToggleRight, Mail, Smartphone, Save,
    Activity, Target, Clock, Zap, Filter
} from 'lucide-react'
import { analyticsApi } from '../../api'
import { Card, Button, Input, Loading, Badge, EmptyState } from '../../components/ui'
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const ALERT_TYPES = [
    { value: 'stock_low', label: 'Stock bas', icon: Package, color: 'warning', description: 'Alerte quand le stock passe sous un seuil' },
    { value: 'sales_drop', label: 'Baisse des ventes', icon: TrendingDown, color: 'danger', description: 'Alerte quand les ventes diminuent' },
    { value: 'sales_spike', label: 'Pic de ventes', icon: TrendingUp, color: 'success', description: 'Alerte quand les ventes augmentent' },
    { value: 'revenue_target', label: 'Objectif CA', icon: Target, color: 'primary', description: 'Alerte quand un objectif de CA est atteint' },
    { value: 'order_value', label: 'Panier moyen', icon: ShoppingCart, color: 'secondary', description: 'Alerte sur le panier moyen' },
]

const ALERT_CONDITIONS = [
    { value: 'less_than', label: 'Inférieur à' },
    { value: 'greater_than', label: 'Supérieur à' },
    { value: 'equals', label: 'Égal à' },
    { value: 'percent_change', label: 'Variation de %' },
]

export default function Alerts() {
    const [loading, setLoading] = useState(true)
    const [alerts, setAlerts] = useState([])
    const [triggeredAlerts, setTriggeredAlerts] = useState([])
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingAlert, setEditingAlert] = useState(null)
    const [filter, setFilter] = useState('all')
    const [formData, setFormData] = useState({
        name: '',
        type: 'stock_low',
        condition: 'less_than',
        threshold: '',
        enabled: true,
        emailNotify: true,
        pushNotify: false
    })

    useEffect(() => {
        loadAlerts()
        checkAlertConditions()
    }, [])

    const loadAlerts = () => {
        // Load from localStorage
        const savedAlerts = localStorage.getItem('analyst_alerts')
        if (savedAlerts) {
            setAlerts(JSON.parse(savedAlerts))
        } else {
            // Default alerts
            const defaultAlerts = [
                {
                    id: 1,
                    name: 'Stock critique',
                    type: 'stock_low',
                    condition: 'less_than',
                    threshold: 10,
                    enabled: true,
                    emailNotify: true,
                    pushNotify: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Objectif mensuel',
                    type: 'revenue_target',
                    condition: 'greater_than',
                    threshold: 50000,
                    enabled: true,
                    emailNotify: true,
                    pushNotify: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Baisse des ventes',
                    type: 'sales_drop',
                    condition: 'percent_change',
                    threshold: -20,
                    enabled: false,
                    emailNotify: false,
                    pushNotify: false,
                    createdAt: new Date().toISOString()
                }
            ]
            setAlerts(defaultAlerts)
            localStorage.setItem('analyst_alerts', JSON.stringify(defaultAlerts))
        }
        setLoading(false)
    }

    const checkAlertConditions = async () => {
        try {
            // Récupérer les vraies données depuis les APIs
            const [kpiRes, lowStockRes, monthlyRes] = await Promise.all([
                analyticsApi.getKPI().catch(() => ({ data: null })),
                analyticsApi.getLowStockProducts(100).catch(() => ({ data: [] })),
                analyticsApi.getMonthlySales().catch(() => ({ data: null }))
            ])

            const kpi = kpiRes.data
            const lowStockProducts = lowStockRes.data || []
            const monthly = monthlyRes.data?.list || monthlyRes.data || []

            // Calculer le stock minimum parmi les produits en stock bas
            const minStock = lowStockProducts.length > 0
                ? Math.min(...lowStockProducts.map(p => p.stock || p.quantity || 0))
                : 50

            // Calculer la variation des ventes par rapport au mois précédent
            let salesChange = 0
            if (monthly.length >= 2) {
                const currentMonth = monthly[monthly.length - 1]?.revenue || monthly[monthly.length - 1]?.totalRevenue || 0
                const previousMonth = monthly[monthly.length - 2]?.revenue || monthly[monthly.length - 2]?.totalRevenue || 0
                if (previousMonth > 0) {
                    salesChange = ((currentMonth - previousMonth) / previousMonth) * 100
                }
            }

            const currentMetrics = {
                stock: minStock,
                lowStockCount: lowStockProducts.length,
                sales: kpi?.sales?.salesCount || 0,
                revenue: kpi?.sales?.totalRevenue || 0,
                avgOrder: kpi?.sales?.averageBasket || 0,
                salesChange: salesChange
            }

            // Check which alerts are triggered
            const triggered = []
            const savedAlerts = JSON.parse(localStorage.getItem('analyst_alerts') || '[]')

            savedAlerts.filter(a => a.enabled).forEach(alert => {
                let value = 0
                let isTriggered = false

                switch (alert.type) {
                    case 'stock_low':
                        value = currentMetrics.stock
                        isTriggered = alert.condition === 'less_than' && value < alert.threshold
                        break
                    case 'sales_drop':
                        value = currentMetrics.salesChange
                        if (alert.condition === 'percent_change') {
                            isTriggered = value < alert.threshold
                        } else {
                            isTriggered = alert.condition === 'less_than' && currentMetrics.sales < alert.threshold
                        }
                        break
                    case 'sales_spike':
                        value = currentMetrics.salesChange
                        if (alert.condition === 'percent_change') {
                            isTriggered = value > Math.abs(alert.threshold)
                        } else {
                            isTriggered = alert.condition === 'greater_than' && currentMetrics.sales > alert.threshold
                        }
                        break
                    case 'revenue_target':
                        value = currentMetrics.revenue
                        isTriggered = alert.condition === 'greater_than'
                            ? value > alert.threshold
                            : value < alert.threshold
                        break
                    case 'order_value':
                        value = currentMetrics.avgOrder
                        isTriggered = alert.condition === 'less_than'
                            ? value < alert.threshold
                            : value > alert.threshold
                        break
                }

                if (isTriggered) {
                    triggered.push({
                        ...alert,
                        currentValue: value,
                        triggeredAt: new Date().toISOString()
                    })
                }
            })

            setTriggeredAlerts(triggered)
        } catch (error) {
            console.error('Error checking alerts:', error)
        }
    }

    const saveAlerts = (newAlerts) => {
        setAlerts(newAlerts)
        localStorage.setItem('analyst_alerts', JSON.stringify(newAlerts))
    }

    const handleCreate = () => {
        if (!formData.name || !formData.threshold) {
            toast.error('Veuillez remplir tous les champs')
            return
        }

        const newAlert = {
            ...formData,
            id: Date.now(),
            threshold: parseFloat(formData.threshold),
            createdAt: new Date().toISOString()
        }

        saveAlerts([...alerts, newAlert])
        setShowCreateModal(false)
        resetForm()
        toast.success('Alerte créée avec succès')
    }

    const handleUpdate = () => {
        if (!formData.name || !formData.threshold) {
            toast.error('Veuillez remplir tous les champs')
            return
        }

        const updatedAlerts = alerts.map(a =>
            a.id === editingAlert.id
                ? { ...a, ...formData, threshold: parseFloat(formData.threshold) }
                : a
        )

        saveAlerts(updatedAlerts)
        setEditingAlert(null)
        resetForm()
        toast.success('Alerte mise à jour')
    }

    const handleDelete = (id) => {
        saveAlerts(alerts.filter(a => a.id !== id))
        toast.success('Alerte supprimée')
    }

    const toggleAlert = (id) => {
        const updatedAlerts = alerts.map(a =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
        )
        saveAlerts(updatedAlerts)
    }

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'stock_low',
            condition: 'less_than',
            threshold: '',
            enabled: true,
            emailNotify: true,
            pushNotify: false
        })
    }

    const openEdit = (alert) => {
        setEditingAlert(alert)
        setFormData({
            name: alert.name,
            type: alert.type,
            condition: alert.condition,
            threshold: alert.threshold.toString(),
            enabled: alert.enabled,
            emailNotify: alert.emailNotify,
            pushNotify: alert.pushNotify
        })
    }

    const getAlertTypeInfo = (type) => ALERT_TYPES.find(t => t.value === type) || ALERT_TYPES[0]

    const filteredAlerts = alerts.filter(alert => {
        if (filter === 'all') return true
        if (filter === 'active') return alert.enabled
        if (filter === 'inactive') return !alert.enabled
        return alert.type === filter
    })

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Alertes Intelligentes
                    </h1>
                    <p className="text-dark-500">Configurez des alertes automatiques sur vos métriques</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle Alerte
                </Button>
            </div>

            {/* Triggered Alerts */}
            {triggeredAlerts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="p-4 bg-gradient-to-r from-warning-50 to-danger-50 dark:from-warning-900/20 dark:to-danger-900/20 border-warning-200 dark:border-warning-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-warning-500 flex items-center justify-center">
                                <BellRing className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-dark-900 dark:text-white">
                                    {triggeredAlerts.length} Alerte{triggeredAlerts.length > 1 ? 's' : ''} Déclenchée{triggeredAlerts.length > 1 ? 's' : ''}
                                </h3>
                                <p className="text-sm text-dark-500">Attention requise</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {triggeredAlerts.map((alert, index) => {
                                const typeInfo = getAlertTypeInfo(alert.type)
                                const Icon = typeInfo.icon
                                return (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 bg-white dark:bg-dark-800 rounded-xl"
                                    >
                                        <Icon className={`w-5 h-5 text-${typeInfo.color}-500`} />
                                        <div className="flex-1">
                                            <p className="font-medium text-dark-900 dark:text-white">{alert.name}</p>
                                            <p className="text-sm text-dark-500">
                                                Valeur actuelle: {formatNumber(alert.currentValue)}
                                                (seuil: {formatNumber(alert.threshold)})
                                            </p>
                                        </div>
                                        <Badge variant={typeInfo.color}>Déclenchée</Badge>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Filter */}
            <Card className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-dark-400" />
                        <span className="font-medium text-dark-700 dark:text-dark-300">Filtrer:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 'all', label: 'Toutes' },
                            { value: 'active', label: 'Actives' },
                            { value: 'inactive', label: 'Inactives' },
                        ].map(f => (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.value
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Alerts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAlerts.map((alert, index) => {
                    const typeInfo = getAlertTypeInfo(alert.type)
                    const Icon = typeInfo.icon
                    const isTriggered = triggeredAlerts.some(t => t.id === alert.id)

                    return (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className={`p-5 ${!alert.enabled ? 'opacity-60' : ''} ${isTriggered ? 'ring-2 ring-warning-500' : ''}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-${typeInfo.color}-100 dark:bg-${typeInfo.color}-900/30 flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 text-${typeInfo.color}-600`} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleAlert(alert.id)}
                                            className="p-1"
                                        >
                                            {alert.enabled ? (
                                                <ToggleRight className="w-8 h-8 text-success-500" />
                                            ) : (
                                                <ToggleLeft className="w-8 h-8 text-dark-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-semibold text-dark-900 dark:text-white mb-1">
                                    {alert.name}
                                </h3>
                                <p className="text-sm text-dark-500 mb-3">
                                    {typeInfo.description}
                                </p>

                                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-xl mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-dark-500">Condition:</span>
                                        <span className="font-medium text-dark-900 dark:text-white">
                                            {ALERT_CONDITIONS.find(c => c.value === alert.condition)?.label} {formatNumber(alert.threshold)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    {alert.emailNotify && (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-xs text-primary-700 dark:text-primary-400">
                                            <Mail className="w-3 h-3" />
                                            Email
                                        </div>
                                    )}
                                    {alert.pushNotify && (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg text-xs text-secondary-700 dark:text-secondary-400">
                                            <Smartphone className="w-3 h-3" />
                                            Push
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-dark-100 dark:border-dark-800">
                                    <span className="text-xs text-dark-400">
                                        Créée le {formatDate(alert.createdAt)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEdit(alert)}
                                            className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4 text-dark-500" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(alert.id)}
                                            className="p-2 hover:bg-danger-100 dark:hover:bg-danger-900/30 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-danger-500" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            {filteredAlerts.length === 0 && (
                <EmptyState
                    icon={Bell}
                    title="Aucune alerte"
                    description="Créez votre première alerte pour surveiller vos métriques"
                    action={
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Créer une alerte
                        </Button>
                    }
                />
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {(showCreateModal || editingAlert) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-dark-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                    {editingAlert ? 'Modifier l\'alerte' : 'Nouvelle Alerte'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false)
                                        setEditingAlert(null)
                                        resetForm()
                                    }}
                                    className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-dark-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                        Nom de l'alerte
                                    </label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Stock critique produits"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                        Type d'alerte
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ALERT_TYPES.map(type => {
                                            const Icon = type.icon
                                            const isSelected = formData.type === type.value
                                            return (
                                                <button
                                                    key={type.value}
                                                    onClick={() => setFormData({ ...formData, type: type.value })}
                                                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${isSelected
                                                        ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                                                        : 'border-dark-200 dark:border-dark-700 hover:border-dark-300'
                                                        }`}
                                                >
                                                    <Icon className={`w-5 h-5 text-${type.color}-500`} />
                                                    <span className="text-sm font-medium text-dark-900 dark:text-white">
                                                        {type.label}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                            Condition
                                        </label>
                                        <select
                                            value={formData.condition}
                                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                            className="w-full px-4 py-3 bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        >
                                            {ALERT_CONDITIONS.map(c => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                            Seuil
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.threshold}
                                            onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                                            placeholder="Ex: 10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                        Notifications
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.emailNotify}
                                                onChange={(e) => setFormData({ ...formData, emailNotify: e.target.checked })}
                                                className="w-4 h-4 rounded text-primary-500"
                                            />
                                            <Mail className="w-4 h-4 text-dark-400" />
                                            <span className="text-sm text-dark-700 dark:text-dark-300">Email</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.pushNotify}
                                                onChange={(e) => setFormData({ ...formData, pushNotify: e.target.checked })}
                                                className="w-4 h-4 rounded text-primary-500"
                                            />
                                            <Smartphone className="w-4 h-4 text-dark-400" />
                                            <span className="text-sm text-dark-700 dark:text-dark-300">Push</span>
                                        </label>
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 p-4 bg-dark-50 dark:bg-dark-800 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.enabled}
                                        onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                                        className="w-5 h-5 rounded text-primary-500"
                                    />
                                    <div>
                                        <p className="font-medium text-dark-900 dark:text-white">Activer l'alerte</p>
                                        <p className="text-sm text-dark-500">L'alerte sera surveillée en temps réel</p>
                                    </div>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-100 dark:border-dark-800">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowCreateModal(false)
                                        setEditingAlert(null)
                                        resetForm()
                                    }}
                                >
                                    Annuler
                                </Button>
                                <Button onClick={editingAlert ? handleUpdate : handleCreate}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingAlert ? 'Mettre à jour' : 'Créer'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
