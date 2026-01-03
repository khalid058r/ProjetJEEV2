import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Briefcase } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button, Input } from '../../components/ui'

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (error) setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const user = await login(formData.email, formData.password)
            const role = user?.role?.toLowerCase()

            // Vérifier si c'est un utilisateur back-office
            if (role === 'acheteur') {
                setError('Ce compte est un compte client. Utilisez le portail client.')
                return
            }

            const routes = {
                admin: '/admin',
                vendeur: '/vendeur',
                analyste: '/analyst',
                investisseur: '/investor'
            }
            navigate(routes[role] || '/admin')
        } catch (err) {
            setError(err.response?.data?.message || 'Email ou mot de passe incorrect')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
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
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-3">
                    <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Portail Employé</span>
                </div>
                <h2 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">
                    Espace Collaborateur 👋
                </h2>
                <p className="text-dark-500">
                    Connectez-vous à votre compte professionnel
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
            <form onSubmit={handleSubmit} className="space-y-5">
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

                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                            Mot de passe
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                            Mot de passe oublié ?
                        </Link>
                    </div>
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
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="remember"
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="remember" className="text-sm text-dark-600 dark:text-dark-400">
                        Se souvenir de moi
                    </label>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    loading={loading}
                >
                    <LogIn className="w-5 h-5 mr-2" />
                    Se connecter
                </Button>
            </form>

            {/* Demo accounts */}
            <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
                <p className="text-sm text-center text-dark-500 mb-4">Comptes de démonstration</p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { role: 'Admin', email: 'admin@test.com' },
                        { role: 'Vendeur', email: 'vendeur@test.com' },
                        { role: 'Analyste', email: 'analyste@test.com' },
                        { role: 'Investisseur', email: 'investisseur@test.com' }
                    ].map((account) => (
                        <button
                            key={account.role}
                            type="button"
                            onClick={() => setFormData({ email: account.email, password: 'password123' })}
                            className="px-3 py-2 text-xs bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 rounded-lg text-dark-600 dark:text-dark-400 transition-colors"
                        >
                            {account.role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Register link */}
            <p className="text-center text-dark-500">
                Pas encore de compte ?{' '}
                <Link
                    to="/register"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                >
                    Créer un compte
                </Link>
            </p>

            {/* Client portal link */}
            <div className="pt-4 border-t border-gray-200 dark:border-dark-700 text-center">
                <Link to="/client/login" className="text-sm text-dark-500 hover:text-dark-700 dark:hover:text-dark-300">
                    Vous êtes client ? <span className="text-emerald-600 dark:text-emerald-400">Accès Espace Client</span>
                </Link>
            </div>
        </div>
    )
}
