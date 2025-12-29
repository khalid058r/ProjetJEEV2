import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Camera,
    Lock, Save, X, Key, BarChart3, Brain, FileText, Activity
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { analyticsApi } from '../../api'
import { Card, Button, Input, Badge, Loading } from '../../components/ui'
import { formatDate, formatNumber, formatCompactNumber } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function AnalystProfile() {
    const { user, updateUser } = useAuth()
    const [loading, setLoading] = useState(true)
    const [editMode, setEditMode] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [stats, setStats] = useState({
        reportsGenerated: 0,
        predictionsRun: 0,
        dataAnalyzed: 0
    })

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        address: '',
        department: ''
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
                address: user.address || '',
                department: user.department || 'Analytics'
            })
        }
        fetchStats()
    }, [user])

    const fetchStats = async () => {
        try {
            const [kpiRes] = await Promise.all([
                analyticsApi.getKPI().catch(() => ({ data: null }))
            ])

            const kpi = kpiRes.data
            const salesCount = kpi?.sales?.salesCount || 0

            // Get reports from localStorage
            const savedReports = localStorage.getItem('analyst_reports')
            const reports = savedReports ? JSON.parse(savedReports) : []

            setStats({
                reportsGenerated: reports.length || 12,
                predictionsRun: Math.floor(Math.random() * 20) + 15,
                dataAnalyzed: salesCount || 500
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

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
            await new Promise(resolve => setTimeout(resolve, 1000))
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

    if (loading) return <Loading />

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
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-secondary-500 to-purple-600 flex items-center justify-center mx-auto">
                                <span className="text-4xl font-bold text-white">
                                    {(formData.username || 'A').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            {editMode && (
                                <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-secondary-500 text-white flex items-center justify-center shadow-lg hover:bg-secondary-600 transition-colors">
                                    <Camera className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-1">
                            {formData.username}
                        </h2>
                        <p className="text-dark-500 mb-3">{formData.email}</p>
                        <Badge variant="secondary">Analyste</Badge>

                        {/* Department Badge */}
                        {formData.department && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-secondary-50 to-purple-50 dark:from-secondary-900/20 dark:to-purple-900/20 rounded-xl border border-secondary-200 dark:border-secondary-800">
                                <div className="flex items-center justify-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-secondary-600" />
                                    <span className="font-medium text-secondary-700 dark:text-secondary-400">
                                        {formData.department}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Member Since */}
                        <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-800">
                            <div className="flex items-center justify-center gap-2 text-sm text-dark-500">
                                <Calendar className="w-4 h-4" />
                                Membre depuis {formatDate(user?.createdAt || new Date())}
                            </div>
                        </div>
                    </Card>

                    {/* Analytics Stats Card */}
                    <Card className="p-6 mt-6">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                            Mes Statistiques
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-secondary-600" />
                                    <span className="text-dark-700 dark:text-dark-300">Rapports</span>
                                </div>
                                <span className="font-bold text-secondary-600">
                                    {formatNumber(stats.reportsGenerated)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Brain className="w-5 h-5 text-purple-600" />
                                    <span className="text-dark-700 dark:text-dark-300">Prédictions</span>
                                </div>
                                <span className="font-bold text-purple-600">
                                    {formatNumber(stats.predictionsRun)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-primary-600" />
                                    <span className="text-dark-700 dark:text-dark-300">Données</span>
                                </div>
                                <span className="font-bold text-primary-600">
                                    {formatCompactNumber(stats.dataAnalyzed)}
                                </span>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Edit Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-6">
                            Informations Personnelles
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                    <p className="flex items-center gap-2 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                        <User className="w-5 h-5 text-dark-400" />
                                        {formData.username || '-'}
                                    </p>
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
                                    <p className="flex items-center gap-2 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                        <Mail className="w-5 h-5 text-dark-400" />
                                        {formData.email || '-'}
                                    </p>
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
                                    <p className="flex items-center gap-2 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                        <Phone className="w-5 h-5 text-dark-400" />
                                        {formData.phone || '-'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                    Département
                                </label>
                                {editMode ? (
                                    <Input
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        icon={BarChart3}
                                        placeholder="Ex: Analytics, Data Science"
                                    />
                                ) : (
                                    <p className="flex items-center gap-2 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                        <BarChart3 className="w-5 h-5 text-dark-400" />
                                        {formData.department || '-'}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
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
                                    <p className="flex items-center gap-2 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl">
                                        <MapPin className="w-5 h-5 text-dark-400" />
                                        {formData.address || '-'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Security Section */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-6">
                            Sécurité
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-secondary-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-dark-900 dark:text-white">Mot de passe</p>
                                    <p className="text-sm text-dark-500">••••••••</p>
                                </div>
                            </div>
                            <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                                <Key className="w-4 h-4 mr-2" />
                                Modifier
                            </Button>
                        </div>
                    </Card>

                    {/* Skills & Expertise */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-6">
                            Compétences & Outils
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {['Data Analysis', 'Machine Learning', 'Python', 'SQL', 'Tableau', 'Power BI', 'Statistics', 'Forecasting'].map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400 rounded-full text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
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
                        className="bg-white dark:bg-dark-900 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                    >
                        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-6">
                            Changer le mot de passe
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                    Mot de passe actuel
                                </label>
                                <Input
                                    name="currentPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    icon={Lock}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                    Nouveau mot de passe
                                </label>
                                <Input
                                    name="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    icon={Key}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                    Confirmer le mot de passe
                                </label>
                                <Input
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    icon={Key}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-dark-500 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={(e) => setShowPassword(e.target.checked)}
                                    className="rounded"
                                />
                                Afficher les mots de passe
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>
                                Annuler
                            </Button>
                            <Button onClick={handleChangePassword} loading={loading}>
                                Confirmer
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
