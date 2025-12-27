import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Package, FolderTree, DollarSign,
    LogOut, TrendingUp, ChevronLeft, ChevronRight, User
} from "lucide-react";
import { useState } from "react";
import { useUser } from "../../context/UserContext";

export default function InvestorSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const links = [
        { to: "/investisseur", icon: LayoutDashboard, label: "Dashboard", exact: true },
        { to: "/investisseur/products", icon: Package, label: "Produits" },
        { to: "/investisseur/categories", icon: FolderTree, label: "Catégories" },
        { to: "/investisseur/financial", icon: DollarSign, label: "Analyse Financière" },
    ];

    return (
        <aside
            className={`relative flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? "w-20" : "w-64"}
        bg-gradient-to-b from-warm-900 via-warm-900 to-warm-950
        border-r border-warm-800`}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-8 p-1.5 bg-warm-800 rounded-full border border-warm-700 text-warm-400 hover:text-white hover:bg-warm-700 transition-colors z-10"
            >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Header */}
            <div className={`p-5 border-b border-warm-800 ${collapsed ? "px-4" : ""}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-xl font-bold text-white">Investisseur</h1>
                            <p className="text-warm-400 text-xs">Tableau de bord</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-3">
                    {links.map(({ to, icon: Icon, label, exact }) => (
                        <li key={to}>
                            <NavLink
                                to={to}
                                end={exact}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive
                                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        : "text-warm-400 hover:text-white hover:bg-warm-800"
                                    } ${collapsed ? "justify-center" : ""}`
                                }
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!collapsed && <span className="font-medium">{label}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer / User */}
            <div className="p-4 border-t border-warm-800">
                {!collapsed ? (
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                                {user?.name || "Investisseur"}
                            </p>
                            <p className="text-warm-500 text-xs truncate">
                                {user?.email || "investor@example.com"}
                            </p>
                        </div>
                    </div>
                ) : null}
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-warm-400 hover:text-coral-400 hover:bg-coral-500/10 rounded-xl transition-colors ${collapsed ? "justify-center" : ""}`}
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
                </button>
            </div>
        </aside>
    );
}
