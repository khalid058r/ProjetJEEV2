import { Bell, Search, Sun, Moon, Settings } from "lucide-react";
import { useDarkMode } from "../../context/DarkModeContext";
import { useLocation } from "react-router-dom";

export default function InvestorNavbar() {
    const { darkMode, toggleDarkMode } = useDarkMode();
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === "/investisseur") return "Dashboard Investisseur";
        if (path.includes("/investisseur/products/")) return "Détails du Produit";
        if (path.includes("/investisseur/products")) return "Analyse des Produits";
        if (path.includes("/investisseur/categories/")) return "Détails de la Catégorie";
        if (path.includes("/investisseur/categories")) return "Analyse des Catégories";
        if (path.includes("/investisseur/financial")) return "Analyse Financière";
        return "Investisseur";
    };

    return (
        <header className={`sticky top-0 z-30 backdrop-blur-lg border-b transition-colors duration-300 ${darkMode
                ? 'bg-warm-900/80 border-warm-800'
                : 'bg-white/80 border-warm-200'
            }`}>
            <div className="flex items-center justify-between h-16 px-6">
                {/* Page Title */}
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-warm-800'}`}>
                    {getPageTitle()}
                </h2>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${darkMode
                            ? 'bg-warm-800 text-warm-400'
                            : 'bg-warm-100 text-warm-500'
                        }`}>
                        <Search className="w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="bg-transparent outline-none text-sm w-40"
                        />
                    </div>

                    {/* Notifications */}
                    <button className={`relative p-2 rounded-xl transition-colors ${darkMode
                            ? 'hover:bg-warm-800 text-warm-400'
                            : 'hover:bg-warm-100 text-warm-500'
                        }`}>
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-coral-500 rounded-full" />
                    </button>

                    {/* Settings */}
                    <button className={`p-2 rounded-xl transition-colors ${darkMode
                            ? 'hover:bg-warm-800 text-warm-400'
                            : 'hover:bg-warm-100 text-warm-500'
                        }`}>
                        <Settings className="w-5 h-5" />
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className={`p-2 rounded-xl transition-colors ${darkMode
                                ? 'bg-warm-800 text-amber-400 hover:bg-warm-700'
                                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                            }`}
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </header>
    );
}
