import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    User, Mail, Phone, MapPin, Edit2, Save, X, Package,
    Award, Settings, LogOut
} from 'lucide-react'
import { customerApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Profile() {
    const { user, logout } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        address: ''
    })

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            setLoading(true)
            const response = await customerApi.getProfile()
            setProfile(response.data)
            setFormData({
                firstName: response.data.firstName || '',
                lastName: response.data.lastName || '',
                phone: response.data.phone || '',
                address: response.data.address || ''
            })
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            await customerApi.updateProfile(formData)
            setProfile({ ...profile, ...formData })
            setEditing(false)
            toast.success('Profil mis à jour')
        } catch (error) {
            toast.error('Erreur lors de la mise à jour')
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = () => {
        if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            logout()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4" />
                        <div className="h-40 bg-gray-200 rounded-2xl" />
                        <div className="h-60 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Mon Profil</h1>
                    <p className="text-gray-500 mt-1">Gérez vos informations personnelles</p>
                </div>

                {/* Profile card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6"
                >
                    {/* Banner */}
                    <div className="h-24 bg-gradient-to-r from-emerald-500 to-emerald-600" />

                    {/* Avatar & Name */}
                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-10">
                            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=10B981&color=fff&size=80`}
                                    alt={user?.username}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 pb-2">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {profile?.firstName && profile?.lastName
                                        ? `${profile.firstName} ${profile.lastName}`
                                        : user?.username
                                    }
                                </h2>
                                <p className="text-gray-500">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {editing ? (
                                    <X className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <Edit2 className="w-5 h-5 text-gray-600" />
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-sm p-6 mb-6"
                >
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Informations personnelles
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prénom
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="px-4 py-2 bg-gray-50 rounded-xl">
                                    {profile?.firstName || '-'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="px-4 py-2 bg-gray-50 rounded-xl">
                                    {profile?.lastName || '-'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Téléphone
                            </label>
                            {editing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="px-4 py-2 bg-gray-50 rounded-xl flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {profile?.phone || '-'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <p className="px-4 py-2 bg-gray-50 rounded-xl flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                {user?.email || '-'}
                            </p>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Adresse
                            </label>
                            {editing ? (
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                />
                            ) : (
                                <p className="px-4 py-2 bg-gray-50 rounded-xl flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {profile?.address || '-'}
                                </p>
                            )}
                        </div>
                    </div>

                    {editing && (
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditing(false)}
                                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Quick links */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100"
                >
                    <Link
                        to="/account/orders"
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Package className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">Mes commandes</p>
                            <p className="text-sm text-gray-500">Suivre vos commandes</p>
                        </div>
                    </Link>

                    <Link
                        to="/account/loyalty"
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Award className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">Programme fidélité</p>
                            <p className="text-sm text-gray-500">Vos points et avantages</p>
                        </div>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors text-left"
                    >
                        <div className="p-2 bg-red-100 rounded-lg">
                            <LogOut className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-red-600">Déconnexion</p>
                            <p className="text-sm text-gray-500">Fermer votre session</p>
                        </div>
                    </button>
                </motion.div>
            </div>
        </div>
    )
}
