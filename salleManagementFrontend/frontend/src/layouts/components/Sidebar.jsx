import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Package,
  Tag,
  ShoppingCart,
  Users,
  BarChart3,
  PieChart,
  TrendingUp,
  FileText,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Briefcase,
  Target,
  Lightbulb,
  Menu,
} from "lucide-react";
import { useAuth, ROLE_ROUTES } from "../../auth";

// Navigation structure by role
const NAVIGATION_CONFIG = {
  ADMIN: {
    main: [
      { name: "Dashboard", to: "/dashboard", icon: Home },
      { name: "Produits", to: "/products", icon: Package },
      { name: "Catégories", to: "/categories", icon: Tag },
      { name: "Ventes", to: "/sales", icon: ShoppingCart },
      { name: "Utilisateurs", to: "/users", icon: Users },
    ],
    analytics: [
      { name: "Vue d'ensemble", to: "/analytics", icon: BarChart3 },
      { name: "Produits", to: "/analytics/products", icon: PieChart },
      { name: "Catégories", to: "/analytics/categories", icon: TrendingUp },
      { name: "Ventes", to: "/analytics/sales", icon: FileText },
    ],
    system: [
      { name: "Alertes", to: "/alerts", icon: Bell },
      { name: "Rapports", to: "/reports", icon: FileText },
      { name: "Paramètres", to: "/settings", icon: Settings },
    ],
  },
  VENDEUR: {
    main: [
      { name: "Tableau de bord", to: "/vendeur", icon: Home },
      { name: "Mes Ventes", to: "/vendeur/sales", icon: ShoppingCart },
      { name: "Produits", to: "/vendeur/products", icon: Package },
      { name: "Catégories", to: "/vendeur/categories", icon: Tag },
    ],
    analytics: [
      { name: "Mes Statistiques", to: "/vendeur/analytics", icon: BarChart3 },
    ],
    system: [
      { name: "Alertes", to: "/vendeur/alerts", icon: Bell },
    ],
  },
  ANALYST: {
    main: [
      { name: "Dashboard", to: "/analyst", icon: LayoutDashboard },
      { name: "Workspace", to: "/analyst/workspace", icon: Briefcase },
    ],
    analytics: [
      { name: "Tendances", to: "/analyst/trends", icon: TrendingUp },
      { name: "Rapports", to: "/analyst/reports", icon: FileText },
      { name: "Exports", to: "/analyst/exports", icon: FileText },
    ],
    system: [
      { name: "Alertes", to: "/analyst/alerts", icon: Bell },
    ],
  },
  INVESTISSEUR: {
    main: [
      { name: "Dashboard Exécutif", to: "/investor", icon: LayoutDashboard },
      { name: "Tendances", to: "/investor/trends", icon: TrendingUp },
      { name: "Opportunités", to: "/investor/opportunities", icon: Lightbulb },
    ],
    analytics: [
      { name: "Rapports", to: "/investor/reports", icon: FileText },
    ],
    system: [
      { name: "Alertes", to: "/investor/alerts", icon: Bell },
    ],
  },
};

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout, role } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = NAVIGATION_CONFIG[role] || NAVIGATION_CONFIG.ADMIN;

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? "justify-center px-4" : "px-6"} h-16 border-b border-gray-200 dark:border-slate-700`}>
        {collapsed ? (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">SaleManager</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gestion des ventes</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        {/* Main section */}
        <NavSection title="Principal" collapsed={collapsed}>
          {navigation.main.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </NavSection>

        {/* Analytics section */}
        {navigation.analytics?.length > 0 && (
          <NavSection title="Analytique" collapsed={collapsed}>
            {navigation.analytics.map((item) => (
              <NavItem key={item.to} {...item} collapsed={collapsed} />
            ))}
          </NavSection>
        )}

        {/* System section */}
        {navigation.system?.length > 0 && (
          <NavSection title="Système" collapsed={collapsed}>
            {navigation.system.map((item) => (
              <NavItem key={item.to} {...item} collapsed={collapsed} />
            ))}
          </NavSection>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 dark:border-slate-700 p-4">
        {collapsed ? (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center p-3 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.username || "Utilisateur"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {role}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-gray-200 dark:border-slate-700 p-4 hidden lg:block">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700"
      >
        <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-800 shadow-xl z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 ${collapsed ? "w-20" : "w-72"
          }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

// Navigation section component
function NavSection({ title, collapsed, children }) {
  return (
    <div className="mb-6">
      {!collapsed && (
        <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {title}
        </p>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// Navigation item component
function NavItem({ name, to, icon: Icon, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${collapsed ? "justify-center" : ""
        } ${isActive
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
        }`
      }
      title={collapsed ? name : undefined}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="text-sm">{name}</span>}
    </NavLink>
  );
}
