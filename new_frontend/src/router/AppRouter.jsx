import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Loading } from '../components/ui'
import { useAuth } from '../context/AuthContext'

// Layouts
import { AdminLayout, VendeurLayout, AnalystLayout, InvestorLayout, AuthLayout } from '../components/layouts'

// Lazy load pages for better performance
const Login = lazy(() => import('../pages/auth/Login'))
const Register = lazy(() => import('../pages/auth/Register'))

// Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('../pages/admin/Products'))
const AdminProductDetail = lazy(() => import('../pages/admin/ProductDetail'))
const AdminCategories = lazy(() => import('../pages/admin/Categories'))
const AdminCategoryDetail = lazy(() => import('../pages/admin/CategoryDetail'))
const AdminSales = lazy(() => import('../pages/admin/Sales'))
const AdminSaleDetail = lazy(() => import('../pages/admin/SaleDetail'))
const AdminUsers = lazy(() => import('../pages/admin/Users'))
const AdminUserDetail = lazy(() => import('../pages/admin/UserDetail'))
const AdminLowStock = lazy(() => import('../pages/admin/LowStock'))
const AdminWorkspace = lazy(() => import('../pages/admin/Workspace'))
const AdminReports = lazy(() => import('../pages/admin/Reports'))
const AdminAnalytics = lazy(() => import('../pages/admin/Analytics'))
const AdminProfile = lazy(() => import('../pages/admin/Profile'))

// Vendeur Pages
const VendeurDashboard = lazy(() => import('../pages/vendeur/Dashboard'))
const VendeurNewSale = lazy(() => import('../pages/vendeur/NewSale'))
const VendeurMySales = lazy(() => import('../pages/vendeur/MySales'))

// Analyst Pages
const AnalystDashboard = lazy(() => import('../pages/analyst/Dashboard'))
const AnalystPredictions = lazy(() => import('../pages/analyst/Predictions'))
const AnalystReports = lazy(() => import('../pages/analyst/Reports'))

// Investor Pages
const InvestorDashboard = lazy(() => import('../pages/investor/Dashboard'))
const InvestorFinancial = lazy(() => import('../pages/investor/Financial'))
const InvestorPerformance = lazy(() => import('../pages/investor/Performance'))

// Suspense wrapper
const SuspenseWrapper = ({ children }) => (
    <Suspense fallback={<Loading fullScreen />}>
        {children}
    </Suspense>
)

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuth()

    // Wait for auth check to complete
    if (loading) {
        return <Loading fullScreen />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (allowedRoles && !allowedRoles.includes(user?.role?.toLowerCase())) {
        // Redirect to appropriate dashboard based on role
        const role = user?.role?.toLowerCase()
        switch (role) {
            case 'admin': return <Navigate to="/admin" replace />
            case 'vendeur': return <Navigate to="/vendeur" replace />
            case 'analyste': return <Navigate to="/analyst" replace />
            case 'investisseur': return <Navigate to="/investor" replace />
            default: return <Navigate to="/login" replace />
        }
    }

    return children
}

// Guest route component
const GuestRoute = ({ children }) => {
    const { isAuthenticated, user, loading } = useAuth()

    // Wait for auth check to complete
    if (loading) {
        return <Loading fullScreen />
    }

    if (isAuthenticated && user) {
        const role = user?.role?.toLowerCase()
        switch (role) {
            case 'admin': return <Navigate to="/admin" replace />
            case 'vendeur': return <Navigate to="/vendeur" replace />
            case 'analyste': return <Navigate to="/analyst" replace />
            case 'investisseur': return <Navigate to="/investor" replace />
            default: break // Don't redirect if role is unknown, stay on guest page
        }
    }

    return children
}

// Role-based redirect component
const RoleRedirect = () => {
    const { user, isAuthenticated, loading } = useAuth()

    // Wait for auth check to complete
    if (loading) {
        return <Loading fullScreen />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    const role = user?.role?.toLowerCase()
    switch (role) {
        case 'admin': return <Navigate to="/admin" replace />
        case 'vendeur': return <Navigate to="/vendeur" replace />
        case 'analyste': return <Navigate to="/analyst" replace />
        case 'investisseur': return <Navigate to="/investor" replace />
        default: return <Navigate to="/login" replace />
    }
}

// 404 Page
const NotFound = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="text-center">
            <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 mb-6">Page non trouvée</p>
            <a
                href="/"
                className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors inline-block"
            >
                Retour à l'accueil
            </a>
        </div>
    </div>
)

export default function AppRouter() {
    return (
        <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RoleRedirect />} />

            {/* Auth routes (guest only) */}
            <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
                <Route path="/login" element={<SuspenseWrapper><Login /></SuspenseWrapper>} />
                <Route path="/register" element={<SuspenseWrapper><Register /></SuspenseWrapper>} />
            </Route>

            {/* Admin routes */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<SuspenseWrapper><AdminDashboard /></SuspenseWrapper>} />

                {/* Products */}
                <Route path="products" element={<SuspenseWrapper><AdminProducts /></SuspenseWrapper>} />
                <Route path="products/:id" element={<SuspenseWrapper><AdminProductDetail /></SuspenseWrapper>} />

                {/* Categories */}
                <Route path="categories" element={<SuspenseWrapper><AdminCategories /></SuspenseWrapper>} />
                <Route path="categories/:id" element={<SuspenseWrapper><AdminCategoryDetail /></SuspenseWrapper>} />

                {/* Sales */}
                <Route path="sales" element={<SuspenseWrapper><AdminSales /></SuspenseWrapper>} />
                <Route path="sales/:id" element={<SuspenseWrapper><AdminSaleDetail /></SuspenseWrapper>} />

                {/* Users */}
                <Route path="users" element={<SuspenseWrapper><AdminUsers /></SuspenseWrapper>} />
                <Route path="users/:id" element={<SuspenseWrapper><AdminUserDetail /></SuspenseWrapper>} />

                {/* Additional Admin Pages */}
                <Route path="low-stock" element={<SuspenseWrapper><AdminLowStock /></SuspenseWrapper>} />
                <Route path="workspace" element={<SuspenseWrapper><AdminWorkspace /></SuspenseWrapper>} />
                <Route path="reports" element={<SuspenseWrapper><AdminReports /></SuspenseWrapper>} />
                <Route path="analytics" element={<SuspenseWrapper><AdminAnalytics /></SuspenseWrapper>} />
                <Route path="profile" element={<SuspenseWrapper><AdminProfile /></SuspenseWrapper>} />
            </Route>

            {/* Vendeur routes */}
            <Route
                path="/vendeur"
                element={
                    <ProtectedRoute allowedRoles={['vendeur']}>
                        <VendeurLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<SuspenseWrapper><VendeurDashboard /></SuspenseWrapper>} />
                <Route path="new-sale" element={<SuspenseWrapper><VendeurNewSale /></SuspenseWrapper>} />
                <Route path="my-sales" element={<SuspenseWrapper><VendeurMySales /></SuspenseWrapper>} />
            </Route>

            {/* Analyst routes */}
            <Route
                path="/analyst"
                element={
                    <ProtectedRoute allowedRoles={['analyste']}>
                        <AnalystLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<SuspenseWrapper><AnalystDashboard /></SuspenseWrapper>} />
                <Route path="analytics" element={<SuspenseWrapper><AnalystDashboard /></SuspenseWrapper>} />
                <Route path="predictions" element={<SuspenseWrapper><AnalystPredictions /></SuspenseWrapper>} />
                <Route path="reports" element={<SuspenseWrapper><AnalystReports /></SuspenseWrapper>} />
            </Route>

            {/* Investor routes */}
            <Route
                path="/investor"
                element={
                    <ProtectedRoute allowedRoles={['investisseur']}>
                        <InvestorLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<SuspenseWrapper><InvestorDashboard /></SuspenseWrapper>} />
                <Route path="products" element={<SuspenseWrapper><InvestorDashboard /></SuspenseWrapper>} />
                <Route path="categories" element={<SuspenseWrapper><InvestorDashboard /></SuspenseWrapper>} />
                <Route path="performance" element={<SuspenseWrapper><InvestorPerformance /></SuspenseWrapper>} />
                <Route path="financial" element={<SuspenseWrapper><InvestorFinancial /></SuspenseWrapper>} />
                <Route path="portfolio" element={<SuspenseWrapper><InvestorDashboard /></SuspenseWrapper>} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}
