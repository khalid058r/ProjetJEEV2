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
  X
} from "lucide-react";

const mainLinks = [
  { name: "Dashboard", to: "/dashboard", icon: LayoutDashboard, gradient: "from-blue-500 to-cyan-500" },
  { name: "Products", to: "/products", icon: Package, gradient: "from-emerald-500 to-teal-500" },
  { name: "Categories", to: "/categories", icon: FolderTree, gradient: "from-amber-500 to-orange-500" },
  { name: "Users", to: "/users", icon: Users2, gradient: "from-violet-500 to-purple-500" },
  { name: "Sales", to: "/sales", icon: ShoppingCart, gradient: "from-rose-500 to-pink-500" },
];

const analyticsLinks = [
  { name: "Overview", to: "/analytics", icon: BarChart3, gradient: "from-indigo-500 to-blue-500" },
  { name: "Products Analytics", to: "/analytics/products", icon: TrendingUp, gradient: "from-cyan-500 to-blue-500" },
  { name: "Categories Analytics", to: "/analytics/categories", icon: PieChart, gradient: "from-pink-500 to-rose-500" },
  { name: "Sales Analytics", to: "/analytics/sales", icon: Sparkles, gradient: "from-orange-500 to-amber-500" },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-72'} bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-screen flex flex-col shadow-2xl transition-all duration-300 relative`}>

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg z-10 hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
      </button>

      {/* LOGO */}
      <div className={`px-4 py-6 ${collapsed ? 'px-3' : 'px-6'} relative z-10`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">SaleManager</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Admin Dashboard</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-6 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700">

        {/* MAIN LINKS */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-3">
              Main Menu
            </p>
          )}
          {mainLinks.map(({ name, to, icon: Icon, gradient }) => {
            const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? name : undefined}
                className={`
                  group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden
                  ${isActive
                    ? "bg-white/10 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20`} />
                )}
                <div className={`
                  relative p-2.5 rounded-xl transition-all duration-300 flex-shrink-0
                  ${isActive
                    ? `bg-gradient-to-br ${gradient} shadow-lg`
                    : 'bg-slate-800/80 group-hover:bg-slate-700'
                  }
                `}>
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                </div>
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium relative">{name}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto text-white/60" />
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
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-3">
              Analytics & Reports
            </p>
          )}
          {analyticsLinks.map(({ name, to, icon: Icon, gradient }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? name : undefined}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden
                  ${isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-15`} />
                )}
                <div className={`
                  relative p-2 rounded-lg transition-all flex-shrink-0
                  ${isActive ? `bg-gradient-to-br ${gradient}` : 'group-hover:bg-slate-800'}
                `}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                </div>
                {!collapsed && (
                  <span className="text-sm relative">{name}</span>
                )}
              </NavLink>
            );
          })}
        </div>

      </nav>

      {/* BOTTOM SECTION */}
      <div className={`p-3 ${collapsed ? 'p-2' : 'p-4'} relative z-10`}>
        {!collapsed && (
          <div className="bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-pink-600/20 rounded-2xl p-4 border border-white/10 mb-3 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Pro Features</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Unlock advanced analytics and AI-powered insights.
            </p>
            <button className="w-full py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]">
              Upgrade Now
            </button>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
        >
          <div className="p-2 rounded-lg bg-slate-800/80 group-hover:bg-red-500/20 transition-all flex-shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
          {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
