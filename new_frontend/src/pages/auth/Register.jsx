import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui'

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'VENDEUR'
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const navigate = useNavigate()

    const roles = [
        { value: 'VENDEUR', label: 'Vendeur', description: 'Gérer les ventes' },
        { value: 'ANALYSTE', label: 'Analyste', description: 'Analyser les données' },
        { value: 'INVESTISSEUR', label: 'Investisseur', description: 'Suivre les performances' }
    ]

    const passwordRequirements = [
        { text: 'Au moins 8 caractères', valid: formData.password.length >= 8 },
        { text: 'Une lettre majuscule', valid: /[A-Z]/.test(formData.password) },
        { text: 'Un chiffre', valid: /\d/.test(formData.password) }
    ]

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (error) setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            return
        }

        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Backend expects: username, email, password, role
            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role
            })

            navigate('/login', {
                state: { message: 'Compte créé avec succès ! Attendez l\'activation par l\'admin.' }
            })
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la création du compte')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6">
                <div className="inline-flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">S</span>
                    </div>
                    <div className="text-left">
                        <h1 className="text-xl font-bold text-dark-900 dark:text-white">SalesManager</h1>
                        <p className="text-xs text-dark-500">Gestion & Analyse</p>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">
                    Créer un compte 🚀
                </h2>
                <p className="text-dark-500">
                    Rejoignez-nous et commencez à gérer vos ventes
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-xl"
                >
                    <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0" />
                    <p className="text-sm text-danger-700 dark:text-danger-300">{error}</p>
                </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                        Nom d'utilisateur
                    </label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="johndoe"
                            required
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                        Adresse email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="exemple@email.com"
                            required
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                        Rôle
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {roles.map((role) => (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                                className={`p-3 rounded-xl border-2 text-center transition-all ${formData.role === role.value
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
                                    }`}
                            >
                                <p className={`text-sm font-medium ${formData.role === role.value
                                    ? 'text-primary-700 dark:text-primary-300'
                                    : 'text-dark-700 dark:text-dark-300'
                                    }`}>
                                    {role.label}
                                </p>
                                <p className="text-xs text-dark-500 mt-0.5">{role.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                        Mot de passe
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className="w-full pl-12 pr-12 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {/* Password requirements */}
                    {formData.password && (
                        <div className="mt-2 space-y-1">
                            {passwordRequirements.map((req) => (
                                <div key={req.text} className="flex items-center gap-2 text-xs">
                                    <Check className={`w-4 h-4 ${req.valid ? 'text-success-500' : 'text-dark-300'}`} />
                                    <span className={req.valid ? 'text-success-600 dark:text-success-400' : 'text-dark-500'}>
                                        {req.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                        Confirmer le mot de passe
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className={`w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border rounded-xl text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${formData.confirmPassword && formData.password !== formData.confirmPassword
                                ? 'border-danger-500'
                                : 'border-gray-200 dark:border-dark-700'
                                }`}
                        />
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-danger-500 mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        id="terms"
                        required
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="terms" className="text-sm text-dark-600 dark:text-dark-400">
                        J'accepte les{' '}
                        <a href="#" className="text-primary-600 hover:underline">conditions d'utilisation</a>
                        {' '}et la{' '}
                        <a href="#" className="text-primary-600 hover:underline">politique de confidentialité</a>
                    </label>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    loading={loading}
                >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Créer mon compte
                </Button>
            </form>

            {/* Login link */}
            <p className="text-center text-dark-500">
                Déjà un compte ?{' '}
                <Link
                    to="/login"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                >
                    Se connecter
                </Link>
            </p>
        </div>
    )
}
