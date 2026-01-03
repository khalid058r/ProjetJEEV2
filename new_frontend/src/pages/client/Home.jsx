import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ShoppingBag, ArrowRight, Truck, Shield, Clock,
    Star, ChevronRight, Package
} from 'lucide-react'
import { shopApi } from '../../api'
import { ProductCard } from '../../components/shop'

export default function Home() {
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [productsRes, categoriesRes] = await Promise.all([
                shopApi.getProducts({ limit: 8 }),
                shopApi.getCategories(),
            ])
            setProducts(productsRes.data?.content || productsRes.data || [])
            setCategories(categoriesRes.data || [])
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const features = [
        {
            icon: Truck,
            title: 'Click & Collect',
            description: 'Commandez en ligne, récupérez en magasin',
        },
        {
            icon: Shield,
            title: 'Paiement Sécurisé',
            description: 'Payez en toute sécurité en magasin',
        },
        {
            icon: Clock,
            title: 'Retrait Rapide',
            description: 'Commande prête en 2h',
        },
        {
            icon: Star,
            title: 'Programme Fidélité',
            description: 'Cumulez des points à chaque achat',
        },
    ]

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                                🎉 Nouveau ! Programme Fidélité
                            </span>
                            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                                Votre boutique
                                <br />
                                <span className="text-emerald-300">Click & Collect</span>
                            </h1>
                            <p className="text-lg lg:text-xl text-emerald-100 mb-8 max-w-lg">
                                Commandez en ligne et récupérez vos achats en magasin.
                                Simple, rapide et sans frais de livraison !
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="px-8 py-4 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-lg"
                                >
                                    Découvrir le catalogue
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <Link
                                    to="/login"
                                    className="px-8 py-4 bg-emerald-800/50 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-emerald-800/70 transition-colors border border-emerald-500/30"
                                >
                                    Se connecter
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="hidden lg:block"
                        >
                            <div className="relative">
                                <div className="w-80 h-80 mx-auto bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center">
                                    <ShoppingBag className="w-40 h-40 text-white/80" />
                                </div>
                                {/* Floating elements */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="absolute -top-4 -right-4 bg-amber-400 text-amber-900 px-4 py-2 rounded-xl font-bold shadow-lg"
                                >
                                    -20%
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                                    className="absolute -bottom-4 -left-4 bg-white text-emerald-700 px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2"
                                >
                                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    4.9/5
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center p-6"
                            >
                                <div className="w-14 h-14 mx-auto mb-4 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                    <feature.icon className="w-7 h-7 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-sm text-gray-500">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                                    Nos Catégories
                                </h2>
                                <p className="text-gray-500 mt-1">Explorez nos différentes catégories</p>
                            </div>
                            <Link
                                to="/shop"
                                className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                            >
                                Voir tout
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {categories.slice(0, 5).map((category, index) => (
                                <motion.div
                                    key={category.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        to={`/shop?category=${category.id}`}
                                        className="block p-6 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all group"
                                    >
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Package className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 text-center">
                                            {category.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 text-center mt-1">
                                            {category.productCount || 0} produits
                                        </p>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Products */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                                Produits Populaires
                            </h2>
                            <p className="text-gray-500 mt-1">Découvrez nos meilleures ventes</p>
                        </div>
                        <Link
                            to="/shop"
                            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                        >
                            Voir le catalogue
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                                    <div className="aspect-square bg-gray-200" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                        <div className="h-6 bg-gray-200 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {products.slice(0, 8).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}

                    {/* CTA */}
                    <div className="text-center mt-12">
                        <button
                            onClick={() => navigate('/shop')}
                            className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
                        >
                            Voir tous les produits
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 bg-emerald-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            Comment ça marche ?
                        </h2>
                        <p className="text-gray-500 mt-2">Trois étapes simples pour vos achats</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '1',
                                title: 'Parcourez',
                                description: 'Explorez notre catalogue et ajoutez vos produits au panier',
                                icon: ShoppingBag,
                            },
                            {
                                step: '2',
                                title: 'Commandez',
                                description: 'Validez votre commande et recevez un code de retrait',
                                icon: Package,
                            },
                            {
                                step: '3',
                                title: 'Récupérez',
                                description: 'Présentez votre code en magasin et récupérez vos achats',
                                icon: Truck,
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.2 }}
                                className="relative text-center"
                            >
                                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                    <item.icon className="w-10 h-10" />
                                </div>
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-8 h-8 bg-amber-400 text-amber-900 rounded-full flex items-center justify-center font-bold text-sm">
                                    {item.step}
                                </span>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-500">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
