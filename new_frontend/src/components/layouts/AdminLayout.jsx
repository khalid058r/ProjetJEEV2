import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard, Package, FolderTree, ShoppingCart, Users,
    BarChart3, Settings, LogOut, Menu, X, Moon, Sun,
    ChevronDown, Search, User, AlertTriangle, Layout, FileText,
    ShoppingBag, Warehouse
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../context/NotificationContext'
import { Avatar, Badge, NotificationCenter } from '../ui'

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Produits', href: '/admin/products', icon: Package },
    { name: 'Catégories', href: '/admin/categories', icon: FolderTree },
    { name: 'Ventes', href: '/admin/sales', icon: ShoppingCart },
    { name: 'Commandes C&C', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Gestion Stock', href: '/admin/stock', icon: Warehouse },
    { name: 'Stock Faible', href: '/admin/low-stock', icon: AlertTriangle },
    { name: 'Utilisateurs', href: '/admin/users', icon: Users },
    { name: 'Workspace', href: '/admin/workspace', icon: Layout },
    { name: 'Rapports', href: '/admin/reports', icon: FileText },
    { name: 'Analytique', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Paramètres', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const { user, logout } = useAuth()
    const { darkMode, toggleDarkMode } = useTheme()
    const { notifications, unreadCount, removeNotification, markAsRead, clearAll } = useNotifications()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getPageTitle = () => {
        const path = location.pathname
        const item = navigation.find(n => n.href === path)
        return item?.name || 'Dashboard'
    }

    return (
        <div className="min-h-screen bg-dark-50 dark:bg-dark-950">
            {/* Mobile sidebar backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-800
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-dark-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-dark-900 dark:text-white">SalesManager</h1>
                            <p className="text-xs text-dark-500">Administration</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                    >
                        <X className="w-5 h-5 text-dark-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                        : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 hover:text-dark-900 dark:hover:text-white'}
                `}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </NavLink>
                        )
                    })}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-gray-200 dark:border-dark-800">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 dark:bg-dark-800">
                        <Avatar name={user?.name || 'Admin'} size="md" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                                {user?.name || 'Administrateur'}
                            </p>
                            <p className="text-xs text-dark-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Top navbar */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-dark-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-800">
                    <div className="flex items-center justify-between h-full px-4 lg:px-8">
                        {/* Left side */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                            >
                                <Menu className="w-6 h-6 text-dark-600 dark:text-dark-400" />
                            </button>
                            <h2 className="text-xl font-semibold text-dark-900 dark:text-white">
                                {getPageTitle()}
                            </h2>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-2">
                            {/* Search */}
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-dark-100 dark:bg-dark-800 rounded-xl">
                                <Search className="w-4 h-4 text-dark-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    className="bg-transparent border-none outline-none text-sm w-40 text-dark-700 dark:text-dark-300 placeholder-dark-400"
                                />
                            </div>

                            {/* Notifications */}
                            <NotificationCenter
                                notifications={notifications}
                                unreadCount={unreadCount}
                                onRemove={removeNotification}
                                onMarkAsRead={markAsRead}
                                onClearAll={clearAll}
                            />

                            {/* Theme toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                            >
                                {darkMode ? (
                                    <Sun className="w-5 h-5 text-warning-500" />
                                ) : (
                                    <Moon className="w-5 h-5 text-dark-600" />
                                )}
                            </button>

                            {/* User menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                                >
                                    <Avatar name={user?.name} size="sm" />
                                    <ChevronDown className="w-4 h-4 text-dark-500" />
                                </button>

                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 py-2"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-700">
                                                <p className="text-sm font-medium text-dark-900 dark:text-white">
                                                    {user?.name}
                                                </p>
                                                <p className="text-xs text-dark-500">{user?.email}</p>
                                            </div>
                                            <button
                                                onClick={() => { navigate('/admin/profile'); setUserMenuOpen(false) }}
                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700"
                                            >
                                                <User className="w-4 h-4" />
                                                Mon Profil
                                            </button>
                                            <button
                                                onClick={() => { navigate('/admin/settings'); setUserMenuOpen(false) }}
                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Paramètres
                                            </button>
                                            <hr className="my-2 border-gray-200 dark:border-dark-700" />
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Déconnexion
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    )
}
