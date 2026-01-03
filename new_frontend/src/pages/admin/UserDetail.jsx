import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft, Edit2, Trash2, User, Mail, Calendar, Shield,
    ShoppingCart, TrendingUp, DollarSign, Target, Award,
    Phone, MapPin, Clock, Activity, BarChart3, UserCheck, UserX
} from 'lucide-react'
import { userApi, saleApi, analyticsApi } from '../../api'
import { Button, Card, Badge, Loading, ConfirmDialog, Avatar } from '../../components/ui'
import { AreaChartComponent, BarChartComponent } from '../../components/charts'
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function UserDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [userSales, setUserSales] = useState([])
    const [userStats, setUserStats] = useState({
        totalSales: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        monthlySales: [],
        topProducts: []
    })
    const [loading, setLoading] = useState(true)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [togglingStatus, setTogglingStatus] = useState(false)

    const roles = {
        ADMIN: { label: 'Administrateur', color: 'danger', icon: Shield },
        VENDEUR: { label: 'Vendeur', color: 'success', icon: ShoppingCart },
        ANALYSTE: { label: 'Analyste', color: 'secondary', icon: BarChart3 },
        INVESTISSEUR: { label: 'Investisseur', color: 'warning', icon: TrendingUp }
    }

    useEffect(() => {
        if (id) fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [userRes, salesRes] = await Promise.all([
                userApi.getById(id),
                saleApi.getAll().catch(() => ({ data: [] }))
            ])

            const userData = userRes.data
            setUser(userData)

            // Filter sales by this user
            const sales = salesRes.data || []
            const filteredSales = sales.filter(s => s.userId === parseInt(id))
            setUserSales(filteredSales)

            // Calculate user stats
            const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)

            // Monthly sales aggregation
            const monthlySalesMap = {}
            const productSalesMap = {}

            filteredSales.forEach(sale => {
                // Monthly
                const date = new Date(sale.saleDate)
                const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
                if (!monthlySalesMap[monthKey]) {
                    monthlySalesMap[monthKey] = { sales: 0, revenue: 0 }
                }
                monthlySalesMap[monthKey].sales++
                monthlySalesMap[monthKey].revenue += sale.totalAmount || 0

                // Product aggregation
                if (sale.lignes) {
                    sale.lignes.forEach(ligne => {
                        const name = ligne.productTitle || 'Produit'
                        if (!productSalesMap[name]) {
                            productSalesMap[name] = { quantity: 0, revenue: 0 }
                        }
                        productSalesMap[name].quantity += ligne.quantity || 0
                        productSalesMap[name].revenue += ligne.lineTotal || 0
                    })
                }
            })

            const monthlySales = Object.entries(monthlySalesMap)
                .map(([name, data]) => ({ name, ...data }))
                .slice(-6)

            const topProducts = Object.entries(productSalesMap)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)

            setUserStats({
                totalSales: filteredSales.length,
                totalRevenue,
                avgOrderValue: filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0,
                monthlySales,
                topProducts
            })

        } catch (error) {
            toast.error('Erreur lors du chargement')
            navigate('/admin/users')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            await userApi.delete(id)
            toast.success('Utilisateur supprimé')
            navigate('/admin/users')
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    const handleToggleStatus = async () => {
        setTogglingStatus(true)
        try {
            if (user.active) {
                await userApi.deactivate(id)
                toast.success(`${user.username} a été désactivé`)
            } else {
                await userApi.activate(id)
                toast.success(`${user.username} a été activé`)
            }
            fetchData()
        } catch (error) {
            toast.error('Erreur lors du changement de statut')
        } finally {
            setTogglingStatus(false)
        }
    }

    if (loading) return <Loading />
    if (!user) return null

    const roleConfig = roles[user.role] || { label: user.role, color: 'default', icon: User }
    const RoleIcon = roleConfig.icon

    return (
        <div className="space-y-6">
            {/* Back Button & Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="flex items-center gap-2 text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Retour aux utilisateurs</span>
                </button>
                <div className="flex items-center gap-3">
                    <Button
                        variant={user.active ? 'warning' : 'success'}
                        onClick={handleToggleStatus}
                        disabled={togglingStatus}
                    >
                        {user.active ? (
                            <>
                                <UserX className="w-4 h-4 mr-2" />
                                Désactiver
                            </>
                        ) : (
                            <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activer
                            </>
                        )}
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/admin/users?edit=${id}`)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Modifier
                    </Button>
                    <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                    </Button>
                </div>
            </div>

            {/* User Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* User Profile Card */}
                <Card className="lg:col-span-1 p-6">
                    <div className="text-center">
                        <div className="relative inline-block">
                            <Avatar
                                name={user.username}
                                size="xl"
                                className="w-24 h-24 text-2xl mx-auto"
                            />
                            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-dark-800 ${user.active ? 'bg-success-500' : 'bg-gray-400'}`} />
                        </div>
                        <h1 className="text-2xl font-bold text-dark-900 dark:text-white mt-4">{user.username}</h1>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <Badge variant={roleConfig.color}>
                                <RoleIcon className="w-3 h-3 mr-1" />
                                {roleConfig.label}
                            </Badge>
                            {user.active ? (
                                <Badge variant="success">Actif</Badge>
                            ) : (
                                <Badge variant="danger">Inactif</Badge>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <Mail className="w-5 h-5 text-primary-500" />
                            <div>
                                <p className="text-xs text-dark-500">Email</p>
                                <p className="text-sm font-medium text-dark-900 dark:text-white">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <Calendar className="w-5 h-5 text-secondary-500" />
                            <div>
                                <p className="text-xs text-dark-500">Date de création</p>
                                <p className="text-sm font-medium text-dark-900 dark:text-white">
                                    {user.createdAt ? formatDate(user.createdAt) : 'Non disponible'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <Activity className="w-5 h-5 text-success-500" />
                            <div>
                                <p className="text-xs text-dark-500">Dernière activité</p>
                                <p className="text-sm font-medium text-dark-900 dark:text-white">
                                    {user.lastLogin ? formatDate(user.lastLogin) : 'Non disponible'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-dark-500">Ventes</p>
                                    <p className="text-xl font-bold text-dark-900 dark:text-white">{formatNumber(userStats.totalSales)}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-success-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-dark-500">Revenus générés</p>
                                    <p className="text-xl font-bold text-success-600">{formatCurrency(userStats.totalRevenue)}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                                    <Target className="w-6 h-6 text-warning-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-dark-500">Panier moyen</p>
                                    <p className="text-xl font-bold text-dark-900 dark:text-white">{formatCurrency(userStats.avgOrderValue)}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Monthly Sales Chart */}
                    {user.role === 'VENDEUR' && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary-500" />
                                Performance mensuelle
                            </h3>
                            {userStats.monthlySales.length > 0 ? (
                                <div className="h-64">
                                    <BarChartComponent
                                        data={userStats.monthlySales}
                                        dataKey="revenue"
                                        xAxisKey="name"
                                        color="#10b981"
                                        showGrid
                                    />
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-dark-500">
                                    Aucune donnée disponible
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </motion.div>

            {/* Top Products */}
            {user.role === 'VENDEUR' && userStats.topProducts.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-warning-500" />
                        Top produits vendus
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {userStats.topProducts.map((product, index) => (
                            <div key={product.title || product.name} className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-warning-500 text-white' :
                                        index === 1 ? 'bg-gray-400 text-white' :
                                            index === 2 ? 'bg-amber-700 text-white' :
                                                'bg-dark-200 dark:bg-dark-700 text-dark-600'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <span className="text-xs text-dark-500">#{index + 1}</span>
                                </div>
                                <p className="font-medium text-dark-900 dark:text-white text-sm truncate">{product.title || product.name}</p>
                                <p className="text-xs text-dark-500 mt-1">{product.quantity} vendus</p>
                                <p className="text-sm font-bold text-success-600 mt-1">{formatCurrency(product.revenue)}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Recent Sales */}
            {user.role === 'VENDEUR' && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-500" />
                        Dernières ventes
                    </h3>
                    {userSales.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-50 dark:bg-dark-800/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-500">ID</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-500">Date</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-500">Articles</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-500">Total</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-dark-500">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                                    {userSales.slice(0, 10).map(sale => (
                                        <tr key={sale.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/50">
                                            <td className="px-4 py-3 text-sm font-medium text-dark-900 dark:text-white">
                                                #{sale.id}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-dark-600 dark:text-dark-400">
                                                {formatDate(sale.saleDate)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="primary">{sale.lignes?.length || 0} articles</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-success-600">
                                                {formatCurrency(sale.totalAmount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'warning'}>
                                                    {sale.status || 'PENDING'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-dark-500">
                            Aucune vente enregistrée
                        </div>
                    )}
                </Card>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Supprimer l'utilisateur"
                message={`Êtes-vous sûr de vouloir supprimer "${user.username}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
            />
        </div>
    )
}
