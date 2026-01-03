import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle,
    ShoppingBag, ArrowLeft, Check, Phone
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function ClientRegister() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        acceptTerms: false
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        if (error) setError('')
    }

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            return false
        }
        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères')
            return false
        }
        if (!formData.acceptTerms) {
            setError('Veuillez accepter les conditions d\'utilisation')
            return false
        }
        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setLoading(true)
        setError('')

        try {
            // Register as ACHETEUR
            await api.post('/auth/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: 'ACHETEUR',
                phone: formData.phone
            })

            toast.success('Bienvenue ! Votre compte a été créé avec succès 🎉')

            // Auto login after registration - les clients ACHETEUR sont automatiquement actifs
            await login(formData.email, formData.password)
            navigate('/shop')
        } catch (err) {
            const message = err.response?.data?.message || 'Erreur lors de la création du compte'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    const passwordStrength = () => {
        const pwd = formData.password
        if (pwd.length === 0) return { strength: 0, label: '' }
        if (pwd.length < 6) return { strength: 1, label: 'Faible', color: 'bg-red-500' }
        if (pwd.length < 8) return { strength: 2, label: 'Moyen', color: 'bg-yellow-500' }
        if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { strength: 3, label: 'Fort', color: 'bg-emerald-500' }
        return { strength: 2, label: 'Moyen', color: 'bg-yellow-500' }
    }

    const pwdStrength = passwordStrength()

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex">
            {/* Left side - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-600 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
                </div>

                <div className="relative z-10">
                    <Link to="/boutique" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        Retour à la boutique
                    </Link>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <ShoppingBag className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Ma Boutique</h1>
                            <p className="text-emerald-100">Click & Collect</p>
                        </div>
                    </div>
                    <p className="text-xl text-emerald-100 max-w-md leading-relaxed">
                        Créez votre compte gratuit et profitez de nombreux avantages exclusifs.
                    </p>
                </div>

                <div className="relative z-10 space-y-3">
                    {[
                        'Suivi de vos commandes en temps réel',
                        'Programme de fidélité avec points bonus',
                        'Retrait rapide Click & Collect',
                        'Offres exclusives réservées aux membres'
                    ].map((benefit, i) => (
                        <div key={i} className="flex items-center gap-3 text-emerald-100">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                            <span>{benefit}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-md space-y-6">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center">
                        <div className="inline-flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <h1 className="text-xl font-bold text-gray-900">Ma Boutique</h1>
                                <p className="text-xs text-gray-500">Click & Collect</p>
                            </div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Créer un compte 🎉
                        </h2>
                        <p className="text-gray-500">
                            Rejoignez-nous en quelques secondes
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
                        >
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom d'utilisateur
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Votre pseudo"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Adresse email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="votre@email.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Téléphone (optionnel)
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+212 6XX XXX XXX"
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {/* Password strength */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 flex-1 rounded-full ${level <= pwdStrength.strength ? pwdStrength.color : 'bg-gray-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs mt-1 ${pwdStrength.strength === 1 ? 'text-red-500' :
                                            pwdStrength.strength === 2 ? 'text-yellow-500' : 'text-emerald-500'
                                        }`}>
                                        {pwdStrength.label}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="acceptTerms"
                                name="acceptTerms"
                                checked={formData.acceptTerms}
                                onChange={handleChange}
                                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                                J'accepte les{' '}
                                <Link to="/terms" className="text-emerald-600 hover:underline">
                                    conditions d'utilisation
                                </Link>{' '}
                                et la{' '}
                                <Link to="/privacy" className="text-emerald-600 hover:underline">
                                    politique de confidentialité
                                </Link>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Créer mon compte
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login link */}
                    <p className="text-center text-gray-500">
                        Déjà un compte ?{' '}
                        <Link to="/client/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                            Se connecter
                        </Link>
                    </p>

                    {/* Back-office link */}
                    <div className="pt-4 border-t border-gray-200 text-center">
                        <Link to="/register" className="text-sm text-gray-500 hover:text-gray-700">
                            Vous êtes employé ? <span className="text-indigo-600">Accès Portail Employé</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
