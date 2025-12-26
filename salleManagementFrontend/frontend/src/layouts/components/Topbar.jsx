import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../auth";
import { alertsApi } from "../../api";

export default function Topbar() {
  const { mode, toggleMode } = useTheme();
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Breadcrumb generation
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await alertsApi.getUnread();
        setNotifications(response.data.slice(0, 5));
        setUnreadCount(response.data.length);
      } catch (error) {
        // Silently fail for notifications
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertsApi.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left side - Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-900 dark:text-white">
                {crumb.label}
              </span>
            ) : (
              <button
                onClick={() => navigate(crumb.path)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {crumb.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Rechercher"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleMode}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title={mode === "light" ? "Mode sombre" : "Mode clair"}
        >
          {mode === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Tout marquer lu
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Aucune notification
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-50 dark:border-slate-700/50 last:border-0"
                      >
                        <p className="text-sm text-gray-900 dark:text-white">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notif.createdAt}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                  <button
                    onClick={() => {
                      navigate("/alerts");
                      setNotificationsOpen(false);
                    }}
                    className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Voir toutes les alertes
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative ml-2" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
            </div>
          </button>

          {/* User menu dropdown */}
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Mon profil
                  </button>
                  <button
                    onClick={() => {
                      navigate("/settings");
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </button>
                </div>

                <div className="border-t border-gray-100 dark:border-slate-700 p-2">
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSearch} className="flex items-center gap-4 p-4">
                <Search className="w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher produits, catégories, ventes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 text-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>

              <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">Entrée</kbd> pour rechercher
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// Breadcrumb generation helper
function generateBreadcrumbs(pathname) {
  const pathMap = {
    "/dashboard": "Dashboard",
    "/products": "Produits",
    "/categories": "Catégories",
    "/sales": "Ventes",
    "/users": "Utilisateurs",
    "/analytics": "Analytique",
    "/alerts": "Alertes",
    "/reports": "Rapports",
    "/settings": "Paramètres",
    "/vendeur": "Vendeur",
    "/analyst": "Analyste",
    "/investor": "Investisseur",
  };

  const parts = pathname.split("/").filter(Boolean);
  const breadcrumbs = [];

  let currentPath = "";
  for (const part of parts) {
    currentPath += `/${part}`;
    const label = pathMap[currentPath] || part.charAt(0).toUpperCase() + part.slice(1);
    breadcrumbs.push({ path: currentPath, label });
  }

  return breadcrumbs.length > 0 ? breadcrumbs : [{ path: "/", label: "Accueil" }];
}
