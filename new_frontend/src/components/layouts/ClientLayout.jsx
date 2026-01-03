import { useState, useEffect } from 'react'
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ShoppingBag, ShoppingCart, User, Search, Menu, X,
    Home, Package, Heart, ClipboardList, Star, LogOut,
    ChevronDown, Phone, MapPin, Clock
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import CartDrawer from '../shop/CartDrawer'
import { NotificationBell } from '../ui'

export default function ClientLayout() {
    const { user, isAuthenticated, logout } = useAuth()
    const { itemCount, toggleDrawer, isDrawerOpen, closeDrawer } = useCart()
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`)
            setSearchQuery('')
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const navigation = [
        { name: 'Accueil', href: '/boutique', icon: Home },
        { name: 'Catalogue', href: '/shop', icon: ShoppingBag },
    ]

    const userNavigation = [
        { name: 'Mon Compte', href: '/account', icon: User },
        { name: 'Mes Commandes', href: '/account/orders', icon: ClipboardList },
        { name: 'Fidélité', href: '/account/loyalty', icon: Star },
    ]

    // Fermer le menu user quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = () => setUserMenuOpen(false)
        if (userMenuOpen) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [userMenuOpen])

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top announcement bar */}
            <div className="bg-emerald-600 text-white text-sm py-2">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Lun-Sam: 9h-19h
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            +212 5XX-XXXXXX
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden md:block">🚚 Click & Collect - Commandez en ligne !</span>
                        <Link
                            to="/login"
                            className="hover:text-emerald-200 transition-colors"
                        >
                            Espace Pro →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">
                                Salle<span className="text-emerald-600">Shop</span>
                            </span>
                        </Link>

                        {/* Search bar - Desktop */}
                        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Rechercher un produit..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                            </div>
                        </form>

                        {/* Navigation - Desktop */}
                        <nav className="hidden lg:flex items-center space-x-6">
                            {navigation.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    className={({ isActive }) => `
                                        text-sm font-medium transition-colors flex items-center gap-1
                                        ${isActive ? 'text-emerald-600' : 'text-gray-700 hover:text-emerald-600'}
                                    `}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </NavLink>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center space-x-3">
                            {/* Search button mobile */}
                            <button
                                className="md:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors"
                                onClick={() => navigate('/shop')}
                            >
                                <Search className="w-6 h-6" />
                            </button>

                            {/* User menu */}
                            {isAuthenticated ? (
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setUserMenuOpen(!userMenuOpen)
                                        }}
                                        className="flex items-center space-x-2 p-2 text-gray-700 hover:text-emerald-600 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <User className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <span className="hidden lg:block text-sm font-medium">{user?.username}</span>
                                        <ChevronDown className="w-4 h-4 hidden lg:block" />
                                    </button>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {userMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                                            >
                                                <div className="px-4 py-2 border-b border-gray-100">
                                                    <p className="font-medium text-gray-900">{user?.username}</p>
                                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                                </div>
                                                {userNavigation.map((item) => (
                                                    <Link
                                                        key={item.name}
                                                        to={item.href}
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <item.icon className="w-4 h-4" />
                                                        {item.name}
                                                    </Link>
                                                ))}
                                                <div className="border-t border-gray-100 mt-2 pt-2">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Déconnexion
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <Link
                                    to="/client/login"
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                                >
                                    <User className="w-5 h-5" />
                                    Connexion
                                </Link>
                            )}

                            {/* Notifications - only for authenticated users */}
                            {isAuthenticated && (
                                <NotificationBell />
                            )}

                            {/* Cart button */}
                            <button
                                onClick={toggleDrawer}
                                className="relative p-2 text-gray-700 hover:text-emerald-600 transition-colors"
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {itemCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center"
                                    >
                                        {itemCount > 99 ? '99+' : itemCount}
                                    </motion.span>
                                )}
                            </button>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile search */}
                    <div className="md:hidden pb-4">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden border-t border-gray-200 bg-white"
                        >
                            <div className="px-4 py-4 space-y-2">
                                {navigation.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                                            ${isActive
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'text-gray-700 hover:bg-gray-50'}
                                        `}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.name}
                                    </NavLink>
                                ))}
                                {isAuthenticated && userNavigation.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                                            ${isActive
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'text-gray-700 hover:bg-gray-50'}
                                        `}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.name}
                                    </NavLink>
                                ))}
                                {!isAuthenticated && (
                                    <Link
                                        to="/client/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                                    >
                                        <User className="w-5 h-5" />
                                        Connexion
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Brand */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                                    <ShoppingBag className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xl font-bold">SalleShop</span>
                            </div>
                            <p className="text-gray-400 mb-4">
                                Votre boutique en ligne avec Click & Collect.
                                Commandez en ligne et récupérez en magasin !
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <MapPin className="w-4 h-4" />
                                123 Rue Example, Casablanca, Maroc
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <h3 className="font-semibold mb-4">Liens Utiles</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link to="/shop" className="hover:text-emerald-400 transition-colors">Catalogue</Link></li>
                                <li><Link to="/account/orders" className="hover:text-emerald-400 transition-colors">Mes Commandes</Link></li>
                                <li><Link to="/account/loyalty" className="hover:text-emerald-400 transition-colors">Programme Fidélité</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="font-semibold mb-4">Contact</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    +212 5XX-XXXXXX
                                </li>
                                <li className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Lun-Sam: 9h-19h
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm">
                            © 2026 SalleShop. Tous droits réservés.
                        </p>
                        <Link
                            to="/login"
                            className="text-gray-400 hover:text-emerald-400 text-sm mt-4 md:mt-0 transition-colors"
                        >
                            Espace Professionnel
                        </Link>
                    </div>
                </div>
            </footer>

            {/* Cart Drawer */}
            <CartDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
        </div>
    )
}
