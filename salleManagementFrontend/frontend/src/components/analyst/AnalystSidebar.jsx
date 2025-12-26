import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    TrendingUp,
    Package,
    Layers,
    BarChart3,
    FileText,
    Settings,
    HelpCircle,
    LogOut,
    Sparkles,
    ChevronRight,
    Activity,
} from "lucide-react";

const navItems = [
    { to: "/analyst", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/analyst/sales", icon: TrendingUp, label: "Analyse Ventes" },
    { to: "/analyst/products", icon: Package, label: "Analyse Produits" },
    { to: "/analyst/categories", icon: Layers, label: "Analyse Catégories" },
    { to: "/analyst/reports", icon: FileText, label: "Rapports" },
    { to: "/analyst/workspace", icon: BarChart3, label: "Espace de Travail" },
];

export default function AnalystSidebar() {
    const location = useLocation();

    const isActive = (path, end = false) => {
        if (end) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 h-full flex flex-col shadow-2xl">

            {/* Logo / Brand */}
            <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">Analyste</h1>
                        <p className="text-xs text-slate-400">Data Analytics</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <p className="px-3 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Analytics
                </p>

                {navItems.map((item) => {
                    const active = isActive(item.to, item.end);
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={`
                                group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                ${active
                                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-400 border border-indigo-500/20"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent"
                                }
                            `}
                        >
                            <div className={`
                                p-2 rounded-lg transition-all duration-200
                                ${active
                                    ? "bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30"
                                    : "bg-slate-800 group-hover:bg-slate-700"
                                }
                            `}>
                                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                            </div>

                            <span className="font-medium flex-1">{item.label}</span>

                            {active && (
                                <ChevronRight className="w-4 h-4 text-indigo-400 animate-pulse" />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Insights Card */}
            <div className="p-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-semibold text-white">AI Insights</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                        Discover patterns and trends in your data with AI-powered analytics.
                    </p>
                    <button className="w-full py-2 px-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200">
                        Explore Insights
                    </button>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-700/50 space-y-2">
                <NavLink
                    to="/analyst/settings"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive
                            ? "bg-slate-800 text-white"
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                        }`
                    }
                >
                    <Settings className="w-4 h-4" />
                    <span className="font-medium text-sm">Paramètres</span>
                </NavLink>

                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = "/login";
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium text-sm">Déconnexion</span>
                </button>
            </div>
        </aside>
    );
}
