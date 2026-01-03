import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Loading } from '../components/ui'

// Layouts
import { AdminLayout, VendeurLayout, AnalystLayout, InvestorLayout, AuthLayout } from '../layouts'

// Auth Components
import { RequireAuth, RequireRole, RequireGuest } from '../auth'

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
const AdminOrders = lazy(() => import('../pages/admin/Orders'))

// Vendeur Pages
const VendeurDashboard = lazy(() => import('../pages/vendeur/Dashboard'))
const VendeurNewSale = lazy(() => import('../pages/vendeur/NewSale'))
const VendeurMySales = lazy(() => import('../pages/vendeur/MySales'))
const VendeurOrders = lazy(() => import('../pages/vendeur/Orders'))

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

// Role-based redirect component
const RoleRedirect = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const role = user?.role?.toLowerCase()

    switch (role) {
        case 'admin':
            return <Navigate to="/admin" replace />
        case 'vendeur':
            return <Navigate to="/vendeur" replace />
        case 'analyste':
            return <Navigate to="/analyst" replace />
        case 'investisseur':
            return <Navigate to="/investor" replace />
        default:
            return <Navigate to="/login" replace />
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
                className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
                Retour à l'accueil
            </a>
        </div>
    </div>
)

export const router = createBrowserRouter([
    // Root redirect
    {
        path: '/',
        element: <RoleRedirect />
    },

    // Auth routes (guest only)
    {
        element: (
            <RequireGuest>
                <AuthLayout />
            </RequireGuest>
        ),
        children: [
            {
                path: '/login',
                element: (
                    <SuspenseWrapper>
                        <Login />
                    </SuspenseWrapper>
                )
            },
            {
                path: '/register',
                element: (
                    <SuspenseWrapper>
                        <Register />
                    </SuspenseWrapper>
                )
            }
        ]
    },

    // Admin routes
    {
        path: '/admin',
        element: (
            <RequireAuth>
                <RequireRole allowedRoles={['admin']}>
                    <AdminLayout />
                </RequireRole>
            </RequireAuth>
        ),
        children: [
            {
                index: true,
                element: (
                    <SuspenseWrapper>
                        <AdminDashboard />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'products',
                element: (
                    <SuspenseWrapper>
                        <AdminProducts />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'products/:id',
                element: (
                    <SuspenseWrapper>
                        <AdminProductDetail />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'categories',
                element: (
                    <SuspenseWrapper>
                        <AdminCategories />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'categories/:id',
                element: (
                    <SuspenseWrapper>
                        <AdminCategoryDetail />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'sales',
                element: (
                    <SuspenseWrapper>
                        <AdminSales />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'sales/:id',
                element: (
                    <SuspenseWrapper>
                        <AdminSaleDetail />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'users',
                element: (
                    <SuspenseWrapper>
                        <AdminUsers />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'users/:id',
                element: (
                    <SuspenseWrapper>
                        <AdminUserDetail />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'low-stock',
                element: (
                    <SuspenseWrapper>
                        <AdminLowStock />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'workspace',
                element: (
                    <SuspenseWrapper>
                        <AdminWorkspace />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'reports',
                element: (
                    <SuspenseWrapper>
                        <AdminReports />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'orders',
                element: (
                    <SuspenseWrapper>
                        <AdminOrders />
                    </SuspenseWrapper>
                )
            }
        ]
    },

    // Vendeur routes
    {
        path: '/vendeur',
        element: (
            <RequireAuth>
                <RequireRole allowedRoles={['vendeur']}>
                    <VendeurLayout />
                </RequireRole>
            </RequireAuth>
        ),
        children: [
            {
                index: true,
                element: (
                    <SuspenseWrapper>
                        <VendeurDashboard />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'new-sale',
                element: (
                    <SuspenseWrapper>
                        <VendeurNewSale />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'my-sales',
                element: (
                    <SuspenseWrapper>
                        <VendeurMySales />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'orders',
                element: (
                    <SuspenseWrapper>
                        <VendeurOrders />
                    </SuspenseWrapper>
                )
            }
        ]
    },

    // Analyst routes
    {
        path: '/analyst',
        element: (
            <RequireAuth>
                <RequireRole allowedRoles={['analyste']}>
                    <AnalystLayout />
                </RequireRole>
            </RequireAuth>
        ),
        children: [
            {
                index: true,
                element: (
                    <SuspenseWrapper>
                        <AnalystDashboard />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'analytics',
                element: (
                    <SuspenseWrapper>
                        <AnalystDashboard />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'predictions',
                element: (
                    <SuspenseWrapper>
                        <AnalystPredictions />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'reports',
                element: (
                    <SuspenseWrapper>
                        <AnalystReports />
                    </SuspenseWrapper>
                )
            }
        ]
    },

    // Investor routes
    {
        path: '/investor',
        element: (
            <RequireAuth>
                <RequireRole allowedRoles={['investisseur']}>
                    <InvestorLayout />
                </RequireRole>
            </RequireAuth>
        ),
        children: [
            {
                index: true,
                element: (
                    <SuspenseWrapper>
                        <InvestorDashboard />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'products',
                element: (
                    <SuspenseWrapper>
                        <InvestorDashboard />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'categories',
                element: (
                    <SuspenseWrapper>
                        <InvestorDashboard />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'performance',
                element: (
                    <SuspenseWrapper>
                        <InvestorPerformance />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'financial',
                element: (
                    <SuspenseWrapper>
                        <InvestorFinancial />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'portfolio',
                element: (
                    <SuspenseWrapper>
                        <InvestorDashboard />
                    </SuspenseWrapper>
                )
            }
        ]
    },

    // 404
    {
        path: '*',
        element: <NotFound />
    }
], {
    // React Router v7 future flags - opt-in to new behavior
    future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
    }
})

export default router
