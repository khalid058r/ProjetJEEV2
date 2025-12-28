import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Camera,
    Lock, Save, X, CheckCircle, Key, Bell, Eye, EyeOff
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../api'
import { Card, Button, Input, Badge, Loading } from '../../components/ui'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function Profile() {
    const { user, updateUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        address: ''
    })

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            })
        }
    }, [user])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        setPasswordData(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // Simuler la sauvegarde
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Update user in auth context if the function exists
            if (updateUser) {
                updateUser({ ...user, ...formData })
            }

            toast.success('Profil mis à jour avec succès')
            setEditMode(false)
        } catch (error) {
            toast.error('Erreur lors de la mise à jour')
        } finally {
            setLoading(false)
        }
    }

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas')
            return
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        setLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('Mot de passe modifié avec succès')
            setShowPasswordModal(false)
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (error) {
            toast.error('Erreur lors du changement de mot de passe')
        } finally {
            setLoading(false)
        }
    }

    const getRoleBadge = (role) => {
        const roleConfig = {
            admin: { color: 'danger', label: 'Administrateur' },
            vendeur: { color: 'success', label: 'Vendeur' },
            analyste: { color: 'primary', label: 'Analyste' },
            investisseur: { color: 'warning', label: 'Investisseur' }
        }
        const config = roleConfig[role?.toLowerCase()] || { color: 'default', label: role }
        return <Badge variant={config.color}>{config.label}</Badge>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Mon Profil</h1>
                    <p className="text-dark-500">Gérez vos informations personnelles</p>
                </div>
                <div className="flex gap-3">
                    {editMode ? (
                        <>
                            <Button variant="ghost" onClick={() => setEditMode(false)}>
                                <X className="w-4 h-4 mr-2" />
                                Annuler
                            </Button>
                            <Button onClick={handleSave} loading={loading}>
                                <Save className="w-4 h-4 mr-2" />
                                Enregistrer
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setEditMode(true)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Modifier
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-1"
                >
                    <Card className="p-6 text-center">
                        {/* Avatar */}
                        <div className="relative inline-block mb-4">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto">
                                <span className="text-4xl font-bold text-white">
                                    {(formData.username || 'U').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            {editMode && (
                                <button className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors">
                                    <Camera className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-1">
                            {formData.username || 'Utilisateur'}
                        </h2>
                        <p className="text-dark-500 mb-3">{formData.email}</p>
                        {getRoleBadge(user?.role)}

                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
                            <div className="flex items-center justify-center gap-2 text-sm text-dark-500">
                                <Calendar className="w-4 h-4" />
                                <span>Membre depuis {formatDate(user?.createdAt) || 'récemment'}</span>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                                <p className="text-2xl font-bold text-primary-600">12</p>
                                <p className="text-xs text-dark-500">Actions</p>
                            </div>
                            <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-xl">
                                <p className="text-2xl font-bold text-success-600">98%</p>
                                <p className="text-xs text-dark-500">Complétion</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Profile Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2"
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-500" />
                            Informations Personnelles
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                    Nom d'utilisateur
                                </label>
                                {editMode ? (
                                    <Input
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        icon={User}
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                        <User className="w-5 h-5 text-dark-400" />
                                        <span className="text-dark-900 dark:text-white">{formData.username || '-'}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                    Email
                                </label>
                                {editMode ? (
                                    <Input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        icon={Mail}
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                        <Mail className="w-5 h-5 text-dark-400" />
                                        <span className="text-dark-900 dark:text-white">{formData.email || '-'}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                    Téléphone
                                </label>
                                {editMode ? (
                                    <Input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        icon={Phone}
                                        placeholder="+212 6XX XXX XXX"
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                        <Phone className="w-5 h-5 text-dark-400" />
                                        <span className="text-dark-900 dark:text-white">{formData.phone || 'Non renseigné'}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                    Adresse
                                </label>
                                {editMode ? (
                                    <Input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        icon={MapPin}
                                        placeholder="Votre adresse"
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                        <MapPin className="w-5 h-5 text-dark-400" />
                                        <span className="text-dark-900 dark:text-white">{formData.address || 'Non renseignée'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
                            <div className="flex items-center gap-3 p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-primary-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-dark-900 dark:text-white">Rôle</p>
                                    <p className="text-sm text-dark-500">{user?.role || 'Non défini'}</p>
                                </div>
                                {getRoleBadge(user?.role)}
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Security Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-3"
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-6 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary-500" />
                            Sécurité
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Password Change */}
                            <div className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                                        <Key className="w-5 h-5 text-warning-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-dark-900 dark:text-white">Mot de passe</p>
                                        <p className="text-sm text-dark-500">Dernière modification: il y a 30 jours</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
                                    Modifier
                                </Button>
                            </div>

                            {/* Notifications */}
                            <div className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-dark-900 dark:text-white">Notifications</p>
                                        <p className="text-sm text-dark-500">Email et push activés</p>
                                    </div>
                                </div>
                                <Badge variant="success">Activé</Badge>
                            </div>
                        </div>

                        {/* Account Activity */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
                            <h4 className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-4">Activité récente</h4>
                            <div className="space-y-3">
                                {[
                                    { action: 'Connexion réussie', time: 'Il y a 2 heures', icon: CheckCircle, color: 'success' },
                                    { action: 'Profil mis à jour', time: 'Hier', icon: Edit2, color: 'primary' },
                                    { action: 'Mot de passe modifié', time: 'Il y a 30 jours', icon: Key, color: 'warning' },
                                ].map((activity, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors">
                                        <div className={`w-8 h-8 rounded-lg bg-${activity.color}-100 dark:bg-${activity.color}-900/30 flex items-center justify-center`}>
                                            <activity.icon className={`w-4 h-4 text-${activity.color}-600`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-dark-900 dark:text-white">{activity.action}</p>
                                        </div>
                                        <span className="text-xs text-dark-400">{activity.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 m-4"
                    >
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5 text-primary-500" />
                            Changer le mot de passe
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                                    Mot de passe actuel
                                </label>
                                <div className="relative">
                                    <Input
                                        name="currentPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        icon={Lock}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                                    Nouveau mot de passe
                                </label>
                                <Input
                                    name="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    icon={Lock}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                                    Confirmer le mot de passe
                                </label>
                                <Input
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    icon={Lock}
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)}
                                    className="rounded border-gray-300"
                                />
                                Afficher les mots de passe
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
                            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>
                                Annuler
                            </Button>
                            <Button onClick={handleChangePassword} loading={loading}>
                                Changer le mot de passe
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
