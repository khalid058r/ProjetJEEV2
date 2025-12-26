import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

// Auth
import { RequireAuth, RequireRole, GuestOnly, AccessDenied } from "../auth";
import { useAuth } from "../auth";

// Layouts
import MainLayout from "../layouts/MainLayout";

// Loading
import { LoadingScreen } from "../components/common/LoadingScreen";

// ===========================================
// Lazy-loaded pages for code splitting
// ===========================================

// Auth pages
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));

// Admin pages
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));

// Vendeur pages
const VendeurDashboard = lazy(() => import("../pages/vendeur/Dashboard"));

// Analyst pages
const AnalystWorkspace = lazy(() => import("../pages/analyst/Workspace"));

// Investor pages
const InvestorDashboard = lazy(() => import("../pages/investor/Dashboard"));

// Reports
const SalesReport = lazy(() => import("../pages/reports/SalesReport"));
const ProductsReport = lazy(() => import("../pages/reports/ProductsReport"));

// Legacy pages (to be migrated)
const Products = lazy(() => import("../pages/Products"));
const ProductDetails = lazy(() => import("../pages/ProductDetails"));
const Categories = lazy(() => import("../pages/Categories"));
const CategoryDetails = lazy(() => import("../pages/CategoryDetails"));
const Sales = lazy(() => import("../pages/Sales"));
const SaleDetails = lazy(() => import("../pages/SaleDetails"));
const Users = lazy(() => import("../pages/Users"));
const UserForm = lazy(() => import("../pages/UserForm"));

// Analytics (legacy)
const Overview = lazy(() => import("../pages/Analytics/Overview"));
const ProductAnalytics = lazy(() => import("../pages/Analytics/ProductAnalytics"));
const CategoryAnalytics = lazy(() => import("../pages/Analytics/CategoryAnalytics"));
const SalesAnalytics = lazy(() => import("../pages/Analytics/SalesAnalytics"));

// Vendeur legacy pages
const VendeurProducts = lazy(() => import("../pages/Vendeur/VendeurProducts"));
const VendeurProductDetails = lazy(() => import("../pages/Vendeur/VendeurProductDetails"));
const VendeurCategories = lazy(() => import("../pages/Vendeur/VendeurCategories"));
const VendeurCategoryDetails = lazy(() => import("../pages/Vendeur/VendeurCategoryDetails"));
const VendeurSales = lazy(() => import("../pages/Vendeur/VendeurSales"));
const VendeurSaleDetails = lazy(() => import("../pages/Vendeur/VendeurSaleDetails"));
const VendeurAnalytics = lazy(() => import("../pages/Vendeur/VendeurAnalytics"));

// ===========================================
// Role-based redirect component
// ===========================================
function RoleBasedRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  switch (user?.role) {
    case "ADMIN":
      return <Navigate to="/admin/dashboard" replace />;
    case "VENDEUR":
      return <Navigate to="/vendeur/dashboard" replace />;
    case "ANALYST":
      return <Navigate to="/analyst/workspace" replace />;
    case "INVESTISSEUR":
      return <Navigate to="/investor/dashboard" replace />;
    default:
      return <Navigate to="/admin/dashboard" replace />;
  }
}

// ===========================================
// Main Router
// ===========================================
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* ============================================= */}
          {/* PUBLIC ROUTES */}
          {/* ============================================= */}
          <Route
            path="/login"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <Register />
              </GuestOnly>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Access denied */}
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* ============================================= */}
          {/* PROTECTED ROUTES - With MainLayout */}
          {/* ============================================= */}
          <Route
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          >
            {/* --------------------------------------------- */}
            {/* ADMIN ROUTES */}
            {/* --------------------------------------------- */}
            <Route
              path="/admin/dashboard"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <AdminDashboard />
                </RequireRole>
              }
            />

            {/* Products Management (ADMIN only) */}
            <Route
              path="/admin/products"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <Products />
                </RequireRole>
              }
            />
            <Route
              path="/admin/products/:id"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <ProductDetails />
                </RequireRole>
              }
            />

            {/* Categories Management (ADMIN only) */}
            <Route
              path="/admin/categories"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <Categories />
                </RequireRole>
              }
            />
            <Route
              path="/admin/categories/:id"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <CategoryDetails />
                </RequireRole>
              }
            />

            {/* Sales Management (ADMIN only) */}
            <Route
              path="/admin/sales"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <Sales />
                </RequireRole>
              }
            />
            <Route
              path="/admin/sales/:id"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <SaleDetails />
                </RequireRole>
              }
            />

            {/* Users Management (ADMIN only) */}
            <Route
              path="/admin/users"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <Users />
                </RequireRole>
              }
            />
            <Route
              path="/admin/users/new"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <UserForm />
                </RequireRole>
              }
            />
            <Route
              path="/admin/users/:id"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <UserForm />
                </RequireRole>
              }
            />

            {/* Admin Analytics */}
            <Route
              path="/admin/analytics"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <Overview />
                </RequireRole>
              }
            />
            <Route
              path="/admin/analytics/products"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <ProductAnalytics />
                </RequireRole>
              }
            />
            <Route
              path="/admin/analytics/categories"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <CategoryAnalytics />
                </RequireRole>
              }
            />
            <Route
              path="/admin/analytics/sales"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <SalesAnalytics />
                </RequireRole>
              }
            />

            {/* --------------------------------------------- */}
            {/* VENDEUR ROUTES */}
            {/* --------------------------------------------- */}
            <Route
              path="/vendeur/dashboard"
              element={
                <RequireRole roles={["VENDEUR", "ADMIN"]}>
                  <VendeurDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/vendeur/products"
              element={
                <RequireRole roles={["VENDEUR", "ADMIN"]}>
                  <VendeurProducts />
                </RequireRole>
              }
            />
            <Route
              path="/vendeur/products/:id"
              element={
                <RequireRole roles={["VENDEUR", "ADMIN"]}>
                  <VendeurProductDetails />
                </RequireRole>
              }
            />
            <Route
              path="/vendeur/categories"
              element={
                <RequireRole roles={["VENDEUR", "ADMIN"]}>
                  <VendeurCategories />
                </RequireRole>
              }
            />
            <Route
              path="/vendeur/categories/:id"
              element={
                <RequireRole roles={["VENDEUR", "ADMIN"]}>
                  <VendeurCategoryDetails />
                </RequireRole>
              }
            />
            <Route
              path="/vendeur/sales"
              element={
                <RequireRole roles={["VENDEUR", "ADMIN"]}>
                  <VendeurSales />
                </RequireRole>
              }
            />
            <Route
              path="/vendeur/sales/:id"
              element={
                <RequireRole roles={["VENDEUR", "ADMIN"]}>
                  <VendeurSaleDetails />
                </RequireRole>
              }
            />
            <Route
              path="/vendeur/analytics"
              element={
                <RequireRole roles={["VENDEUR", "ADMIN"]}>
                  <VendeurAnalytics />
                </RequireRole>
              }
            />

            {/* --------------------------------------------- */}
            {/* ANALYST ROUTES */}
            {/* --------------------------------------------- */}
            <Route
              path="/analyst/workspace"
              element={
                <RequireRole roles={["ANALYST", "ADMIN"]}>
                  <AnalystWorkspace />
                </RequireRole>
              }
            />

            {/* --------------------------------------------- */}
            {/* INVESTOR ROUTES */}
            {/* --------------------------------------------- */}
            <Route
              path="/investor/dashboard"
              element={
                <RequireRole roles={["INVESTISSEUR", "ADMIN"]}>
                  <InvestorDashboard />
                </RequireRole>
              }
            />

            {/* --------------------------------------------- */}
            {/* REPORTS (Multiple roles) */}
            {/* --------------------------------------------- */}
            <Route
              path="/reports/sales"
              element={
                <RequireRole roles={["ADMIN", "ANALYST", "INVESTISSEUR"]}>
                  <SalesReport />
                </RequireRole>
              }
            />
            <Route
              path="/reports/products"
              element={
                <RequireRole roles={["ADMIN", "ANALYST", "INVESTISSEUR"]}>
                  <ProductsReport />
                </RequireRole>
              }
            />

            {/* --------------------------------------------- */}
            {/* LEGACY ROUTES (backward compatibility) */}
            {/* --------------------------------------------- */}
            <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/products" element={<Navigate to="/admin/products" replace />} />
            <Route path="/categories" element={<Navigate to="/admin/categories" replace />} />
            <Route path="/sales" element={<Navigate to="/admin/sales" replace />} />
            <Route path="/users" element={<Navigate to="/admin/users" replace />} />
            <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
          </Route>

          {/* ============================================= */}
          {/* FALLBACK ROUTES */}
          {/* ============================================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
