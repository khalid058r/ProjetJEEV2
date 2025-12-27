import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Users2,
  ShoppingCart,
  BarChart3,
  PieChart,
  TrendingUp,
  Sparkles,
  ChevronRight,
  LogOut,
  Menu,
  X,
  FileText,
  Settings,
  Briefcase,
  Sun,
  Moon,
} from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext";

const mainLinks = [
  { name: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { name: "Products", to: "/products", icon: Package },
  { name: "Categories", to: "/categories", icon: FolderTree },
  { name: "Users", to: "/users", icon: Users2 },
  { name: "Sales", to: "/sales", icon: ShoppingCart },
];

const analyticsLinks = [
  { name: "Overview", to: "/analytics", icon: BarChart3 },
  { name: "Products Analytics", to: "/analytics/products", icon: TrendingUp },
  { name: "Categories Analytics", to: "/analytics/categories", icon: PieChart },
  { name: "Sales Analytics", to: "/analytics/sales", icon: Sparkles },
  { name: "Reports", to: "/analytics/reports", icon: FileText },
  { name: "Workspace", to: "/analytics/workspace", icon: Briefcase },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <aside 
      className={`${collapsed ? 'w-20' : 'w-72'} min-h-screen flex flex-col transition-all duration-300 relative border-r ${
        isDark 
          ? 'bg-warm-950 border-warm-800' 
          : 'bg-white border-warm-200'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-10 hover:scale-110 transition-transform ${
          isDark ? 'bg-coral-500' : 'bg-coral-500'
        }`}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-white" />
        ) : (
          <X className="w-3 h-3 text-white" />
        )}
      </button>

      {/* LOGO */}
      <div className={`px-4 py-6 ${collapsed ? 'px-3' : 'px-6'}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-warm-900'}`}>
                SaleManager
              </h1>
              <p className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-warm-500' : 'text-warm-400'}`}>
                Dashboard
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-6 overflow-y-auto scrollbar-thin">
        {/* MAIN LINKS */}
        <div className="space-y-1">
          {!collapsed && (
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 px-3 ${
              isDark ? 'text-warm-500' : 'text-warm-400'
            }`}>
              Main Menu
            </p>
          )}
          {mainLinks.map(({ name, to, icon: Icon }) => {
            const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? name : undefined}
                className={`
                  group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative
                  ${isActive
                    ? isDark 
                      ? "bg-coral-500/15 text-coral-400 border-l-4 border-coral-500"
                      : "bg-coral-50 text-coral-600 border-l-4 border-coral-500"
                    : isDark
                      ? "text-warm-400 hover:text-white hover:bg-warm-800/50"
                      : "text-warm-500 hover:text-warm-900 hover:bg-warm-100"
                  }
                `}
              >
                <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                  isActive 
                    ? isDark ? 'bg-coral-500/20' : 'bg-coral-100'
                    : isDark ? 'bg-warm-800' : 'bg-warm-100 group-hover:bg-warm-200'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    isActive 
                      ? isDark ? 'text-coral-400' : 'text-coral-600'
                      : isDark ? 'text-warm-400' : 'text-warm-500'
                  }`} />
                </div>
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium">{name}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* ANALYTICS SECTION */}
        <div className="space-y-1">
          {!collapsed && (
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 px-3 ${
              isDark ? 'text-warm-500' : 'text-warm-400'
            }`}>
              Analytics & Reports
            </p>
          )}
          {analyticsLinks.map(({ name, to, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? name : undefined}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
                  ${isActive
                    ? isDark 
                      ? "bg-teal-500/15 text-teal-400"
                      : "bg-teal-50 text-teal-600"
                    : isDark
                      ? "text-warm-400 hover:text-white hover:bg-warm-800/50"
                      : "text-warm-500 hover:text-warm-900 hover:bg-warm-100"
                  }
                `}
              >
                <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                  isActive 
                    ? isDark ? 'bg-teal-500/20' : 'bg-teal-100'
                    : isDark ? 'bg-warm-800' : 'bg-warm-100 group-hover:bg-warm-200'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    isActive 
                      ? isDark ? 'text-teal-400' : 'text-teal-600'
                      : isDark ? 'text-warm-500' : 'text-warm-500'
                  }`} />
                </div>
                {!collapsed && (
                  <span className="text-sm">{name}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* BOTTOM SECTION */}
      <div className={`p-3 ${collapsed ? 'p-2' : 'p-4'} space-y-3`}>
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
            isDark 
              ? 'text-warm-400 hover:bg-warm-800 hover:text-white'
              : 'text-warm-500 hover:bg-warm-100 hover:text-warm-900'
          }`}
        >
          <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${
            isDark ? 'bg-warm-800' : 'bg-warm-100'
          }`}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </div>
          {!collapsed && (
            <span className="text-sm font-medium">
              {isDark ? 'Mode Clair' : 'Mode Sombre'}
            </span>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
            isDark 
              ? 'text-warm-400 hover:bg-coral-500/10 hover:text-coral-400'
              : 'text-warm-500 hover:bg-coral-50 hover:text-coral-600'
          }`}
        >
          <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${
            isDark 
              ? 'bg-warm-800 group-hover:bg-coral-500/20'
              : 'bg-warm-100 group-hover:bg-coral-100'
          }`}>
            <LogOut className="w-4 h-4" />
          </div>
          {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
