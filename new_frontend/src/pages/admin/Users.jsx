import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Edit2, Trash2, Users as UsersIcon, Shield,
    Mail, Calendar, MoreVertical, Search, UserCheck, UserX, Power, Eye,
    ChevronLeft, ChevronRight, ShoppingBag, Briefcase
} from 'lucide-react'
import { userApi } from '../../api'
import { Button, Card, Modal, Input, Badge, Loading, EmptyState, ConfirmDialog, SearchInput, Avatar } from '../../components/ui'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function Users() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [userTypeFilter, setUserTypeFilter] = useState(searchParams.get('type') || 'backoffice') // 'backoffice' or 'clients'
    const [showModal, setShowModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'VENDEUR'
    })
    const [submitting, setSubmitting] = useState(false)
    const [togglingStatus, setTogglingStatus] = useState(null)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const backOfficeRoles = [
        { value: 'ADMIN', label: 'Administrateur', color: 'danger' },
        { value: 'VENDEUR', label: 'Vendeur', color: 'success' },
        { value: 'ANALYSTE', label: 'Analyste', color: 'secondary' },
        { value: 'INVESTISSEUR', label: 'Investisseur', color: 'warning' }
    ]

    const roles = userTypeFilter === 'clients'
        ? [{ value: 'ACHETEUR', label: 'Client', color: 'primary' }]
        : backOfficeRoles

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await userApi.getAll()
            setUsers(response.data || [])
        } catch (error) {
            toast.error('Erreur lors du chargement des utilisateurs')
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(user => {
        // Filter by user type first
        const isClient = user.role === 'ACHETEUR'
        if (userTypeFilter === 'clients' && !isClient) return false
        if (userTypeFilter === 'backoffice' && isClient) return false

        const matchesSearch =
            user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = !roleFilter || user.role === roleFilter
        const matchesStatus = !statusFilter ||
            (statusFilter === 'active' && user.active) ||
            (statusFilter === 'inactive' && !user.active)
        return matchesSearch && matchesRole && matchesStatus
    })

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredUsers.slice(start, start + itemsPerPage)
    }, [filteredUsers, currentPage, itemsPerPage])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, roleFilter, statusFilter, userTypeFilter])

    // Update URL when user type changes
    useEffect(() => {
        setSearchParams({ type: userTypeFilter })
        setRoleFilter('') // Reset role filter when switching type
    }, [userTypeFilter])

    const getRoleBadge = (role) => {
        const allRoles = [
            ...backOfficeRoles,
            { value: 'ACHETEUR', label: 'Client', color: 'primary' }
        ]
        const roleConfig = allRoles.find(r => r.value === role) || { label: role, color: 'default' }
        return <Badge variant={roleConfig.color}>{roleConfig.label}</Badge>
    }

    const getStatusBadge = (active) => {
        return active ? (
            <Badge variant="success">
                <UserCheck className="w-3 h-3 mr-1" />
                Actif
            </Badge>
        ) : (
            <Badge variant="danger">
                <UserX className="w-3 h-3 mr-1" />
                Inactif
            </Badge>
        )
    }

    const handleToggleStatus = async (user) => {
        setTogglingStatus(user.id)
        try {
            if (user.active) {
                await userApi.deactivate(user.id)
                toast.success(`${user.username} a été désactivé`)
            } else {
                await userApi.activate(user.id)
                toast.success(`${user.username} a été activé`)
            }
            fetchUsers()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors du changement de statut')
        } finally {
            setTogglingStatus(null)
        }
    }

    const handleOpenModal = (user = null) => {
        if (user) {
            setSelectedUser(user)
            setFormData({
                username: user.username || '',
                email: user.email || '',
                password: '',
                role: user.role || 'VENDEUR'
            })
        } else {
            setSelectedUser(null)
            setFormData({ username: '', email: '', password: '', role: 'VENDEUR' })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setSelectedUser(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const userData = {
                username: formData.username,
                email: formData.email,
                role: formData.role
            }

            if (formData.password) {
                userData.password = formData.password
            }

            if (selectedUser) {
                await userApi.update(selectedUser.id, userData)
                toast.success('Utilisateur mis à jour')
            } else {
                if (!formData.password) {
                    toast.error('Le mot de passe est requis')
                    setSubmitting(false)
                    return
                }
                await userApi.create(userData)
                toast.success('Utilisateur créé')
            }

            fetchUsers()
            handleCloseModal()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedUser) return

        try {
            await userApi.delete(selectedUser.id)
            toast.success('Utilisateur supprimé')
            fetchUsers()
            setShowDeleteConfirm(false)
            setSelectedUser(null)
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    if (loading) return <Loading />

    // Stats by role
    const roleStats = roles.map(role => ({
        ...role,
        count: users.filter(u => u.role === role.value).length
    }))

    // Total counts
    const backOfficeCount = users.filter(u => u.role !== 'ACHETEUR').length
    const clientsCount = users.filter(u => u.role === 'ACHETEUR').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        {userTypeFilter === 'clients' ? 'Clients' : 'Collaborateurs'}
                    </h1>
                    <p className="text-dark-500">
                        {userTypeFilter === 'clients'
                            ? `${clientsCount} clients inscrits`
                            : `${backOfficeCount} collaborateurs`}
                    </p>
                </div>
                {userTypeFilter === 'backoffice' && (
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="w-5 h-5 mr-2" />
                        Nouvel Utilisateur
                    </Button>
                )}
            </div>

            {/* User Type Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-dark-800 rounded-xl w-fit">
                <button
                    onClick={() => setUserTypeFilter('backoffice')}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${userTypeFilter === 'backoffice'
                            ? 'bg-white dark:bg-dark-700 text-indigo-600 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}
                    `}
                >
                    <Briefcase className="w-4 h-4" />
                    Back-Office ({backOfficeCount})
                </button>
                <button
                    onClick={() => setUserTypeFilter('clients')}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${userTypeFilter === 'clients'
                            ? 'bg-white dark:bg-dark-700 text-emerald-600 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}
                    `}
                >
                    <ShoppingBag className="w-4 h-4" />
                    Clients ({clientsCount})
                </button>
            </div>

            {/* Role Stats */}
            <div className={`grid gap-4 ${userTypeFilter === 'clients' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
                {roleStats.map((role) => (
                    <Card
                        key={role.value}
                        className={`p-4 cursor-pointer transition-all ${roleFilter === role.value ? 'ring-2 ring-primary-500' : ''
                            }`}
                        onClick={() => setRoleFilter(roleFilter === role.value ? '' : role.value)}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-dark-500">{role.label}</p>
                                <p className="text-2xl font-bold text-dark-900 dark:text-white">{role.count}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl bg-${role.color}-100 dark:bg-${role.color}-900/30 flex items-center justify-center`}>
                                <Shield className={`w-5 h-5 text-${role.color}-600`} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Rechercher par nom ou email..."
                        />
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Tous les rôles</option>
                            {roles.map(role => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:w-40">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Tous statuts</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Inactifs</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Users Table */}
            {filteredUsers.length > 0 ? (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-50 dark:bg-dark-800/50">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Utilisateur</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Email</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Rôle</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Statut</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-500">Créé le</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-dark-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                                <AnimatePresence>
                                    {paginatedUsers.map((user, index) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="hover:bg-dark-50 dark:hover:bg-dark-800/50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={user.username} size="md" />
                                                    <span className="font-medium text-dark-900 dark:text-white">
                                                        {user.username}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
                                                    <Mail className="w-4 h-4" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(user.active)}
                                            </td>
                                            <td className="px-6 py-4 text-dark-500 text-sm">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => navigate(`/admin/users/${user.id}`)}
                                                        className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                        title="Voir détails"
                                                    >
                                                        <Eye className="w-4 h-4 text-primary-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        disabled={togglingStatus === user.id}
                                                        className={`p-2 rounded-lg transition-colors ${user.active
                                                            ? 'hover:bg-warning-50 dark:hover:bg-warning-900/20'
                                                            : 'hover:bg-success-50 dark:hover:bg-success-900/20'
                                                            }`}
                                                        title={user.active ? 'Désactiver' : 'Activer'}
                                                    >
                                                        <Power className={`w-4 h-4 ${togglingStatus === user.id
                                                            ? 'animate-spin text-dark-400'
                                                            : user.active
                                                                ? 'text-warning-500'
                                                                : 'text-success-500'
                                                            }`} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(user)}
                                                        className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-dark-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedUser(user); setShowDeleteConfirm(true) }}
                                                        className="p-2 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-danger-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-700 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-dark-500">
                                    Affichage {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} sur {filteredUsers.length}
                                </span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1) }}
                                    className="px-3 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"
                                >
                                    <option value={5}>5 / page</option>
                                    <option value={10}>10 / page</option>
                                    <option value={20}>20 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let page
                                    if (totalPages <= 5) {
                                        page = i + 1
                                    } else if (currentPage <= 3) {
                                        page = i + 1
                                    } else if (currentPage >= totalPages - 2) {
                                        page = totalPages - 4 + i
                                    } else {
                                        page = currentPage - 2 + i
                                    }
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                ? 'bg-primary-500 text-white'
                                                : 'text-dark-600 hover:bg-dark-100 dark:hover:bg-dark-700'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                })}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            ) : (
                <EmptyState
                    icon={UsersIcon}
                    title="Aucun utilisateur trouvé"
                    description="Ajoutez votre premier utilisateur"
                    action={
                        <Button onClick={() => handleOpenModal()}>
                            <Plus className="w-5 h-5 mr-2" />
                            Ajouter un utilisateur
                        </Button>
                    }
                />
            )}

            {/* User Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nom d'utilisateur"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        required
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                    />

                    <Input
                        label={selectedUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required={!selectedUser}
                    />

                    <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                            Rôle
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {roles.map(role => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                        <Button type="button" variant="ghost" onClick={handleCloseModal}>
                            Annuler
                        </Button>
                        <Button type="submit" loading={submitting}>
                            {selectedUser ? 'Mettre à jour' : 'Créer'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Supprimer l'utilisateur"
                message={`Êtes-vous sûr de vouloir supprimer "${selectedUser?.username}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
            />
        </div>
    )
}
