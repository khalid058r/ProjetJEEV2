import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function ClientLogin() {
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
            const role = user?.role?.toUpperCase()

            // Si c'est un client (ACHETEUR), rediriger vers la boutique
            if (role === 'ACHETEUR') {
                navigate('/shop')
            } else {
                // Sinon rediriger vers le login back-office
                setError('Ce compte n\'est pas un compte client. Utilisez le portail employé.')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Email ou mot de passe incorrect')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex">
            {/* Left side - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-600 p-12 flex-col justify-between relative overflow-hidden">
                {/* Background pattern */}
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
                        Connectez-vous pour accéder à votre panier, suivre vos commandes et profiter de vos avantages fidélité.
                    </p>
                </div>

                <div className="relative z-10 grid grid-cols-3 gap-4">
                    {[
                        { label: 'Commandes suivies', value: '24h/24' },
                        { label: 'Retrait rapide', value: '2h' },
                        { label: 'Points fidélité', value: '+10%' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-sm text-emerald-100">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
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
                            Connexion Client 🛒
                        </h2>
                        <p className="text-gray-500">
                            Accédez à votre espace client
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
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    Mot de passe
                                </label>
                                <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
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
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="remember" className="text-sm text-gray-600">
                                Se souvenir de moi
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
                                    <LogIn className="w-5 h-5" />
                                    Se connecter
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register link */}
                    <p className="text-center text-gray-500">
                        Pas encore de compte ?{' '}
                        <Link to="/client/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                            Créer un compte
                        </Link>
                    </p>

                    {/* Back-office link */}
                    <div className="pt-4 border-t border-gray-200 text-center">
                        <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                            Vous êtes employé ? <span className="text-indigo-600">Accès Portail Employé</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
