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
  Sparkles,
  X,
  Target,
  Zap,
} from "lucide-react";

const navItems = [
  { to: "/vendeur", icon: LayoutDashboard, label: "Dashboard", end: true, gradient: "from-blue-500 to-cyan-500" },
  { to: "/vendeur/categories", icon: FolderTree, label: "Catégories", gradient: "from-amber-500 to-orange-500" },
  { to: "/vendeur/products", icon: Package, label: "Produits", gradient: "from-emerald-500 to-teal-500" },
  { to: "/vendeur/sales", icon: ShoppingCart, label: "Mes Ventes", gradient: "from-rose-500 to-pink-500" },
  { to: "/vendeur/analytics", icon: BarChart3, label: "Analytics", gradient: "from-indigo-500 to-purple-500" },
];

export default function VendeurSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path, end = false) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 h-full flex flex-col shadow-2xl transition-all duration-300 relative`}>

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -right-20 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg z-10 hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
      </button>

      {/* Logo / Brand */}
      <div className={`p-6 border-b border-slate-800/50 ${collapsed ? 'p-4' : ''} relative z-10`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Vendeur</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Sales Portal</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto relative z-10">
        {!collapsed && (
          <p className="px-3 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
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
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }
              `}
            >
              {active && (
                <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-20`} />
              )}
              <div className={`
                relative p-2.5 rounded-xl transition-all duration-300 flex-shrink-0
                ${active
                  ? `bg-gradient-to-br ${item.gradient} shadow-lg shadow-emerald-500/30`
                  : "bg-slate-800 group-hover:bg-slate-700"
                }
              `}>
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
              </div>

              {!collapsed && (
                <>
                  <span className="font-medium flex-1 relative">{item.label}</span>
                  {active && (
                    <ChevronRight className="w-4 h-4 text-white/60" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Pro Features Card */}
      {!collapsed && (
        <div className="p-4 relative z-10">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Sales Tips</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Track your best products and optimize your sales strategy!
            </p>
            <NavLink
              to="/vendeur/analytics"
              className="block w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-xs font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 text-center hover:scale-[1.02]"
            >
              View Analytics
            </NavLink>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className={`p-4 border-t border-slate-800/50 ${collapsed ? 'p-2' : ''} relative z-10`}>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          title={collapsed ? "Déconnexion" : undefined}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
        >
          <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-red-500/20 transition-all flex-shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
          {!collapsed && <span className="font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
