
// // import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// // import { useAuth } from "../context/AuthContext";

// // import Login from "../pages/Login";
// // import Register from "../pages/Register";

// // import AppLayout from "../layouts/AppLayout";

// // import Dashboard from "../pages/Dashboard";
// // import Products from "../pages/Products";
// // import ProductDetails from "../pages/ProductDetails";

// // import Categories from "../pages/Categories";
// // import CategoryDetails from "../pages/CategoryDetails";

// // import Users from "../pages/Users";

// // import Sales from "../pages/Sales";
// // import SaleDetails from "../pages/SaleDetails";

// // function PrivateRoute({ children }) {
// //   const { isAuth } = useAuth();
// //   return isAuth ? children : <Navigate to="/" />;
// // }

// // export default function AppRouter() {
// //   return (
// //     <BrowserRouter>
// //       <Routes>

// //         {/* PUBLIC ROUTES */}
// //         <Route path="/" element={<Login />} />
// //         <Route path="/register" element={<Register />} />

// //         {/* PROTECTED ROUTES */}
// //         <Route
// //           element={
// //             <PrivateRoute>
// //               <AppLayout />
// //             </PrivateRoute>
// //           }
// //         >
// //           <Route path="/dashboard" element={<Dashboard />} />

// //           {/* Products */}
// //           <Route path="/products" element={<Products />} />
// //           <Route path="/products/:id" element={<ProductDetails />} />

// //           {/* Categories */}
// //           <Route path="/categories" element={<Categories />} />
// //           <Route path="/categories/:id" element={<CategoryDetails />} />

// //           {/* Sales */}
// //           <Route path="/sales" element={<Sales />} />
// //           <Route path="/sales/:id" element={<SaleDetails />} />

// //           {/* Users */}
// //           <Route path="/users" element={<Users />} />
// //         </Route>

// //       </Routes>
// //     </BrowserRouter>
// //   );
// // }

// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Login from "../pages/Login";
// import AppLayout from "../layouts/AppLayout";
// import Dashboard from "../pages/Dashboard";
// import Products from "../pages/Products";
// import ProductDetails from "../pages/ProductDetails";
// import Categories from "../pages/Categories";
// import CategoryDetails from "../pages/CategoryDetails";
// import Users from "../pages/Users";
// import UserForm from "../pages/UserForm";
// import Sales from "../pages/Sales";
// import SaleDetails from "../pages/SaleDetails";
// import Register from "../pages/Register"

// import Overview from "../pages/Analytics/Overview"
// import ProductAnalytics from "../pages/Analytics/ProductAnalytics"
// import CategoryAnalytics from "../pages/Analytics/CategoryAnalytics"
// import SalesAnalytics from "../pages/Analytics/SalesAnalytics"


// // import VendeurHome from "../pages/role-tests/VendeurHome";
// import AnalysteHome from "../pages/role-tests/AnalysteHome";
// import AcheteurHome from "../pages/role-tests/AcheteurHome";
// import InvestisseurHome from "../pages/role-tests/InvestisseurHome";

// import VendeurLayout from "../layouts/VendeurLayot";
// import VendeurHome from "../pages/Vendeur/VendeurHome";
// import VendeurSales from "../pages/Vendeur/VendeurSales";
// import VendeurSaleDetails from "../pages/Vendeur/VendeurSaleDetails";
// import VendeurAnalytics from "../pages/Vendeur/VendeurAnalytics";
// import VendeurProducts from "../pages/Vendeur/VendeurProducts";
// import VendeurProductDetails from "../pages/Vendeur/VendeurProductDetails";

// import VendeurCategories from "../pages/Vendeur/VendeurCategories";
// import VendeurCategoryDetails from "../pages/Vendeur/VendeurCategoryDetails";

// export default function AppRouter() {
//   return (
//     <BrowserRouter>
//       <Routes>

//         <Route path="/" element={<Login />} />
//         <Route path="/register" element={<Register />} />

//         <Route path="/vendeur" element={<VendeurLayout />}>

//         <Route path="/vendeur/products" element={<VendeurProducts />} />
//         <Route path="/vendeur/products/:id" element={<VendeurProductDetails />} />

//         <Route path="/vendeur/categories" element={<VendeurCategories />} />
//         <Route path="/vendeur/categories/:id" element={<VendeurCategoryDetails />} />


//           <Route index element={<VendeurHome />} />
//           <Route path="/vendeur/sales" element={<VendeurSales />} />
//           <Route path="/vendeur/sales/:id" element={<VendeurSaleDetails />} />
//           <Route path="analytics" element={<VendeurAnalytics />} />
//         </Route>

//         <Route element={<AppLayout />}>
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/products" element={<Products />} />
//           <Route path="/products/:id" element={<ProductDetails />} />
//           <Route path="/categories" element={<Categories />} />
//           <Route path="/categories/:id" element={<CategoryDetails />} />
//           <Route path="/sales" element={<Sales />} />
//           <Route path="/sales/:id" element={<SaleDetails />} />
//           <Route path="/users" element={<Users />} />
//           <Route path="/users/new" element={<UserForm />} />
//           <Route path="/users/:id" element={<UserForm />} />
//           <Route path="/analytics" element={<Overview />} />
//           <Route path="/analytics/products" element={<ProductAnalytics />} />
//           <Route path="/analytics/categories" element={<CategoryAnalytics />} />
//           <Route path="/analytics/sales" element={<SalesAnalytics />} />
//         </Route>
//         <Route path="/vendeur" element={<VendeurHome />} />
//         <Route path="/analyste" element={<AnalysteHome />} />
//         <Route path="/acheteur" element={<AcheteurHome />} />
//         <Route path="/investisseur" element={<InvestisseurHome />} />

//       </Routes>
//     </BrowserRouter>
//   );
// }
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";

import AppLayout from "../layouts/AppLayout";
import VendeurLayout from "../layouts/VendeurLayot";
import AnalystLayout from "../layouts/AnalystLayout";
import InvestorLayout from "../layouts/InvestorLayout";

// ADMIN
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Categories from "../pages/Categories";
import CategoryDetails from "../pages/CategoryDetails";
import Sales from "../pages/Sales";
import SaleDetails from "../pages/SaleDetails";
import Users from "../pages/Users";
import UserForm from "../pages/UserForm";

// ANALYTICS
import Overview from "../pages/Analytics/Overview";
import ProductAnalytics from "../pages/Analytics/ProductAnalytics";
import CategoryAnalytics from "../pages/Analytics/CategoryAnalytics";
import SalesAnalytics from "../pages/Analytics/SalesAnalytics";
import Reports from "../pages/Analytics/Reports";
import Workspace from "../pages/Analytics/Workspace";

// VENDEUR ROLE
import VendeurHome from "../pages/Vendeur/VendeurDashboard";
import VendeurSales from "../pages/Vendeur/VendeurSales";
import VendeurSaleDetails from "../pages/Vendeur/VendeurSaleDetails";
import VendeurAnalytics from "../pages/Vendeur/VendeurAnalytics";
import VendeurProducts from "../pages/Vendeur/VendeurProducts";
import VendeurProductDetails from "../pages/Vendeur/VendeurProductDetails";
import VendeurCategories from "../pages/Vendeur/VendeurCategories";
import VendeurCategoryDetails from "../pages/Vendeur/VendeurCategoryDetails";

// ANALYST ROLE
import AnalystDashboard from "../pages/analyst/AnalystDashboard";
import AnalystSalesAnalytics from "../pages/analyst/AnalystSalesAnalytics";
import AnalystProductAnalytics from "../pages/analyst/AnalystProductAnalytics";
import AnalystCategoryAnalytics from "../pages/analyst/AnalystCategoryAnalytics";
import AnalystReports from "../pages/analyst/AnalystReports";
import AnalystWorkspace from "../pages/analyst/AnalystWorkspace";

// INVESTOR ROLE
import InvestorDashboard from "../pages/Investor/InvestorDashboard";
import InvestorProducts from "../pages/Investor/InvestorProducts";
import InvestorProductDetail from "../pages/Investor/InvestorProductDetail";
import InvestorCategories from "../pages/Investor/InvestorCategories";
import InvestorCategoryDetail from "../pages/Investor/InvestorCategoryDetail";
import InvestorFinancialAnalysis from "../pages/Investor/InvestorFinancialAnalysis";

import AnalysteHome from "../pages/role-tests/AnalysteHome";
import AcheteurHome from "../pages/role-tests/AcheteurHome";
import NotFound from "../pages/NotFound";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} /> {/* ✅ FIX */}
        <Route path="/register" element={<Register />} />

        {/* ================= VENDEUR ================= */}
        <Route path="/vendeur" element={<VendeurLayout />}>
          <Route index element={<VendeurHome />} />

          <Route path="products" element={<VendeurProducts />} />
          <Route path="products/:id" element={<VendeurProductDetails />} />

          <Route path="categories" element={<VendeurCategories />} />
          <Route path="categories/:id" element={<VendeurCategoryDetails />} />

          <Route path="sales" element={<VendeurSales />} />
          <Route path="sales/:id" element={<VendeurSaleDetails />} />

          <Route path="/vendeur/analytics" element={<VendeurAnalytics />} />
        </Route>

        {/* ================= ANALYST ================= */}
        <Route path="/analyst" element={<AnalystLayout />}>
          <Route index element={<AnalystDashboard />} />
          <Route path="sales" element={<AnalystSalesAnalytics />} />
          <Route path="products" element={<AnalystProductAnalytics />} />
          <Route path="categories" element={<AnalystCategoryAnalytics />} />
          <Route path="reports" element={<AnalystReports />} />
          <Route path="workspace" element={<AnalystWorkspace />} />
        </Route>

        {/* ================= INVESTOR ================= */}
        <Route path="/investisseur" element={<InvestorLayout />}>
          <Route index element={<InvestorDashboard />} />
          <Route path="products" element={<InvestorProducts />} />
          <Route path="products/:id" element={<InvestorProductDetail />} />
          <Route path="categories" element={<InvestorCategories />} />
          <Route path="categories/:id" element={<InvestorCategoryDetail />} />
          <Route path="financial" element={<InvestorFinancialAnalysis />} />
        </Route>

        {/* ================= ADMIN ================= */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />

          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:id" element={<CategoryDetails />} />

          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/:id" element={<SaleDetails />} />

          <Route path="/users" element={<Users />} />
          <Route path="/users/new" element={<UserForm />} />
          <Route path="/users/:id" element={<UserForm />} />

          <Route path="/analytics" element={<Overview />} />
          <Route path="/analytics/products" element={<ProductAnalytics />} />
          <Route path="/analytics/categories" element={<CategoryAnalytics />} />
          <Route path="/analytics/sales" element={<SalesAnalytics />} />
          <Route path="/analytics/reports" element={<Reports />} />
          <Route path="/analytics/workspace" element={<Workspace />} />
        </Route>

        {/* ================= AUTRES ROLES ================= */}
        <Route path="/analyste" element={<Navigate to="/analyst" replace />} />
        <Route path="/acheteur" element={<AcheteurHome />} />

        {/* ================= 404 NOT FOUND ================= */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
