import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  BarChart3,
  LogOut,
  Store,
  ChevronRight,
  ChevronLeft,
  Target,
  Moon,
  Sun,
} from "lucide-react";
import { useDarkMode } from "../../context/DarkModeContext";

const navItems = [
  { to: "/vendeur", icon: LayoutDashboard, label: "Dashboard", end: true, gradient: "from-coral-500 to-coral-600" },
  { to: "/vendeur/categories", icon: FolderTree, label: "Catégories", gradient: "from-hof-400 to-hof-500" },
  { to: "/vendeur/products", icon: Package, label: "Produits", gradient: "from-teal-500 to-teal-600" },
  { to: "/vendeur/sales", icon: ShoppingCart, label: "Mes Ventes", gradient: "from-arches-500 to-arches-600" },
  { to: "/vendeur/analytics", icon: BarChart3, label: "Analytics", gradient: "from-coral-500 to-coral-600" },
];

export default function VendeurSidebar() {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path, end = false) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`
      ${collapsed ? 'w-20' : 'w-64'} 
      h-full flex flex-col transition-all duration-300 relative
      ${darkMode
        ? 'bg-warm-900 border-r border-warm-800'
        : 'bg-white border-r border-warm-200'
      }
    `}>
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`
          absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-10 
          hover:scale-110 transition-transform bg-gradient-to-r from-coral-500 to-coral-600
        `}
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
      </button>

      {/* Logo / Brand */}
      <div className={`p-6 border-b ${darkMode ? 'border-warm-800' : 'border-warm-200'} ${collapsed ? 'p-4' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 flex-shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>Vendeur</h1>
              <p className={`text-[10px] uppercase tracking-widest ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>
                Sales Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className={`px-3 mb-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>
            Menu
          </p>
        )}

        {navItems.map((item) => {
          const active = isActive(item.to, item.end);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={`
                group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden
                ${active
                  ? darkMode
                    ? "bg-coral-500/10 text-coral-400 border border-coral-500/20"
                    : "bg-coral-50 text-coral-600 border border-coral-200"
                  : darkMode
                    ? "text-warm-400 hover:bg-warm-800/50 hover:text-white border border-transparent"
                    : "text-warm-600 hover:bg-warm-50 hover:text-warm-900 border border-transparent"
                }
              `}
            >
              <div className={`
                relative p-2.5 rounded-xl transition-all duration-300 flex-shrink-0
                ${active
                  ? `bg-gradient-to-br ${item.gradient} shadow-lg shadow-coral-500/30`
                  : darkMode
                    ? "bg-warm-800 group-hover:bg-warm-700"
                    : "bg-warm-100 group-hover:bg-warm-200"
                }
              `}>
                <Icon className={`w-4 h-4 ${active ? "text-white" : darkMode ? "text-warm-400 group-hover:text-white" : "text-warm-500 group-hover:text-warm-700"}`} />
              </div>

              {!collapsed && (
                <>
                  <span className="font-medium flex-1 relative">{item.label}</span>
                  {active && (
                    <ChevronRight className="w-4 h-4 text-coral-500" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Pro Features Card */}
      {!collapsed && (
        <div className="p-4">
          <div className={`p-4 rounded-2xl border backdrop-blur-sm ${darkMode
              ? 'bg-gradient-to-br from-coral-500/10 to-teal-500/5 border-coral-500/20'
              : 'bg-gradient-to-br from-coral-50 to-teal-50 border-coral-100'
            }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-gradient-to-br from-coral-500 to-coral-600 rounded-xl shadow-lg">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                Sales Tips
              </span>
            </div>
            <p className={`text-xs mb-4 leading-relaxed ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
              Track your best products and optimize your sales!
            </p>
            <NavLink
              to="/vendeur/analytics"
              className="block w-full py-2.5 px-3 bg-gradient-to-r from-coral-500 to-coral-600 text-white text-xs font-semibold rounded-xl hover:shadow-lg hover:shadow-coral-500/25 transition-all duration-300 text-center hover:scale-[1.02]"
            >
              View Analytics
            </NavLink>
          </div>
        </div>
      )}

      {/* Theme Toggle */}
      <div className={`p-4 border-t ${darkMode ? 'border-warm-800' : 'border-warm-200'}`}>
        <button
          onClick={toggleDarkMode}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
            ${darkMode
              ? 'bg-warm-800 hover:bg-warm-700 text-warm-300'
              : 'bg-warm-50 hover:bg-warm-100 text-warm-600'
            }
          `}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && (
            <span className="font-medium text-sm">
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>
      </div>

      {/* Logout */}
      <div className={`p-4 border-t ${darkMode ? 'border-warm-800' : 'border-warm-200'} ${collapsed ? 'p-2' : ''}`}>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          title={collapsed ? "Déconnexion" : undefined}
          className={`
            w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group
            ${collapsed ? 'justify-center' : ''}
            ${darkMode
              ? 'text-warm-400 hover:bg-coral-500/10 hover:text-coral-400'
              : 'text-warm-500 hover:bg-coral-50 hover:text-coral-600'
            }
          `}
        >
          <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${darkMode
              ? 'bg-warm-800 group-hover:bg-coral-500/20'
              : 'bg-warm-100 group-hover:bg-coral-100'
            }`}>
            <LogOut className="w-4 h-4" />
          </div>
          {!collapsed && <span className="font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
