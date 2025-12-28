import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout() {
    return (
        <div className="min-h-screen flex bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-primary-600 to-secondary-600 relative overflow-hidden">
                {/* Background patterns */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>

                {/* Floating shapes */}
                <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm"
                />
                <motion.div
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm"
                />
                <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-white/10 rounded-3xl backdrop-blur-sm"
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">S</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">SalesManager</h1>
                                <p className="text-sm text-white/70">Gestion & Analyse de Ventes</p>
                            </div>
                        </div>

                        <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                            Gérez vos ventes avec intelligence
                        </h2>
                        <p className="text-lg text-white/80 mb-8 leading-relaxed">
                            Une plateforme complète pour gérer vos produits, suivre vos ventes et analyser vos performances avec l'aide de l'intelligence artificielle.
                        </p>

                        {/* Features */}
                        <div className="space-y-4">
                            {[
                                'Tableau de bord en temps réel',
                                'Prédictions IA avancées',
                                'Rapports personnalisables',
                                'Gestion multi-utilisateurs'
                            ].map((feature, index) => (
                                <motion.div
                                    key={feature}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-white/90">{feature}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Stats */}
                <div className="absolute bottom-0 left-0 right-0 p-8 xl:p-12 bg-gradient-to-t from-black/20 to-transparent">
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { value: '10K+', label: 'Utilisateurs' },
                            { value: '500K', label: 'Transactions' },
                            { value: '99.9%', label: 'Uptime' }
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-2xl xl:text-3xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-white/70">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    <Outlet />
                </motion.div>
            </div>
        </div>
    )
}
