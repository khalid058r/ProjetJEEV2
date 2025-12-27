import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
    LayoutDashboard,
    TrendingUp,
    Package,
    Layers,
    BarChart3,
    FileText,
    Settings,
    LogOut,
    Sparkles,
    ChevronRight,
    Activity,
    Moon,
    Sun,
    ChevronLeft,
} from "lucide-react";
import { useDarkMode } from "../../context/DarkModeContext";

const navItems = [
    { to: "/analyst", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/analyst/sales", icon: TrendingUp, label: "Analyse Ventes" },
    { to: "/analyst/products", icon: Package, label: "Analyse Produits" },
    { to: "/analyst/categories", icon: Layers, label: "Analyse Catégories" },
    { to: "/analyst/reports", icon: FileText, label: "Rapports" },
    { to: "/analyst/workspace", icon: BarChart3, label: "Workspace" },
];

export default function AnalystSidebar() {
    const location = useLocation();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (path, end = false) => {
        if (end) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <aside
            className={`
                ${collapsed ? 'w-20' : 'w-64'} 
                h-full flex flex-col transition-all duration-300 ease-in-out relative
                ${darkMode
                    ? 'bg-warm-900 border-r border-warm-800'
                    : 'bg-white border-r border-warm-200'
                }
            `}
        >
            {/* Logo / Brand */}
            <div className={`p-6 border-b ${darkMode ? 'border-warm-800' : 'border-warm-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-coral-500 to-coral-600 rounded-xl flex items-center justify-center shadow-lg shadow-coral-500/25 flex-shrink-0">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                                Analyste
                            </h1>
                            <p className={`text-xs ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
                                Data Analytics
                            </p>
                        </div>
                    )}
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={`
                        absolute top-6 ${collapsed ? 'left-14' : 'left-56'}
                        p-1.5 rounded-full transition-all duration-300
                        ${darkMode
                            ? 'bg-warm-800 hover:bg-warm-700 text-warm-400'
                            : 'bg-warm-100 hover:bg-warm-200 text-warm-600'
                        }
                        shadow-md z-10
                    `}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {!collapsed && (
                    <p className={`px-3 mb-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>
                        Analytics
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
                                group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                                ${collapsed ? 'justify-center' : ''}
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
                                p-2 rounded-lg transition-all duration-200 flex-shrink-0
                                ${active
                                    ? "bg-gradient-to-br from-coral-500 to-coral-600 shadow-lg shadow-coral-500/30"
                                    : darkMode
                                        ? "bg-warm-800 group-hover:bg-warm-700"
                                        : "bg-warm-100 group-hover:bg-warm-200"
                                }
                            `}>
                                <Icon className={`w-4 h-4 ${active ? "text-white" : darkMode ? "text-warm-400 group-hover:text-white" : "text-warm-500 group-hover:text-warm-700"}`} />
                            </div>

                            {!collapsed && (
                                <>
                                    <span className="font-medium flex-1 truncate">{item.label}</span>
                                    {active && (
                                        <ChevronRight className="w-4 h-4 text-coral-500 animate-pulse" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* AI Insights Card */}
            {!collapsed && (
                <div className="p-4">
                    <div className={`p-4 rounded-2xl ${darkMode
                        ? 'bg-gradient-to-br from-coral-500/10 to-teal-500/5 border border-coral-500/20'
                        : 'bg-gradient-to-br from-coral-50 to-teal-50 border border-coral-100'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-coral-500" />
                            <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                                AI Insights
                            </span>
                        </div>
                        <p className={`text-xs mb-3 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
                            Discover patterns and trends with AI analytics.
                        </p>
                        <button className="w-full py-2 px-3 bg-gradient-to-r from-coral-500 to-coral-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg hover:shadow-coral-500/25 transition-all duration-200">
                            Explore Insights
                        </button>
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

            {/* Bottom Actions */}
            <div className={`p-4 border-t ${darkMode ? 'border-warm-800' : 'border-warm-200'} space-y-2`}>
                <NavLink
                    to="/analyst/settings"
                    title={collapsed ? "Paramètres" : undefined}
                    className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                        ${collapsed ? 'justify-center' : ''}
                        ${darkMode
                            ? 'text-warm-400 hover:bg-warm-800/50 hover:text-white'
                            : 'text-warm-500 hover:bg-warm-50 hover:text-warm-700'
                        }
                    `}
                >
                    <Settings className="w-4 h-4" />
                    {!collapsed && <span className="font-medium text-sm">Paramètres</span>}
                </NavLink>

                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = "/login";
                    }}
                    title={collapsed ? "Déconnexion" : undefined}
                    className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                        ${collapsed ? 'justify-center' : ''}
                        ${darkMode
                            ? 'text-warm-400 hover:bg-coral-500/10 hover:text-coral-400'
                            : 'text-warm-500 hover:bg-coral-50 hover:text-coral-600'
                        }
                    `}
                >
                    <LogOut className="w-4 h-4" />
                    {!collapsed && <span className="font-medium text-sm">Déconnexion</span>}
                </button>
            </div>
        </aside>
    );
}
