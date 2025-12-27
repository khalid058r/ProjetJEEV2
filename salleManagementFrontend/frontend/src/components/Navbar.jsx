import { useState, useEffect, useRef } from "react";
import { MoonIcon, SunIcon, BellIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";
import { UserMenu } from "./UserMenu";
import { alertsApi } from "../api";

export default function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const { theme, toggleMode, setPrimary } = useTheme();

  // Charger les alertes au montage
  useEffect(() => {
    loadNotifications();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await alertsApi.getAll();
      const alerts = response.data || [];

      // Transformer les alertes en notifications
      const notifs = alerts.slice(0, 10).map(alert => ({
        id: alert.id,
        message: alert.message || alert.title,
        type: alert.type || 'info',
        time: formatTimeAgo(alert.createdAt || alert.dateCreation),
        read: alert.read || alert.isRead || false,
        severity: alert.severity || 'low'
      }));

      setNotifications(notifs);
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
      // Fallback avec données mock si le backend n'est pas disponible
      setNotifications([
        { id: 1, message: "Bienvenue sur SaleManager!", type: "info", time: "Maintenant", read: false, severity: "low" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Récemment";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await alertsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await alertsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type, severity) => {
    const colors = {
      stock: 'bg-amber-100 text-amber-600',
      sale: 'bg-green-100 text-green-600',
      user: 'bg-blue-100 text-blue-600',
      product: 'bg-purple-100 text-purple-600',
      critical: 'bg-red-100 text-red-600',
      info: 'bg-gray-100 text-gray-600'
    };
    return colors[type] || colors[severity === 'high' ? 'critical' : 'info'];
  };

  return (
    <div
      className={`
        flex justify-between items-center px-6 py-4 border-b transition-all duration-300 backdrop-blur-sm sticky top-0 z-40
        ${theme.mode === 'dark'
          ? 'bg-warm-950/95 border-warm-800'
          : 'bg-white/95 border-warm-100'
        }
      `}
    >
      {/* Recherche */}
      <div className="relative group">
        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none`}>
          <svg className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-warm-500' : 'text-warm-400'} group-focus-within:text-coral-500 transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Rechercher..."
          className={`
            pl-12 pr-4 py-3 rounded-2xl w-80 transition-all duration-300
            ${theme.mode === 'dark'
              ? 'bg-warm-900/80 text-white placeholder-warm-500 border-warm-700 focus:bg-warm-900 focus:border-coral-500'
              : 'bg-warm-50 text-warm-900 placeholder-warm-400 border-warm-200 focus:bg-white focus:border-coral-500'
            }
            border-2 focus:outline-none focus:ring-4 focus:ring-coral-500/20 hover:border-coral-400/50
          `}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Mode switch */}
        <button
          onClick={toggleMode}
          className={`
            p-3 rounded-2xl transition-all duration-300 group relative overflow-hidden
            ${theme.mode === 'dark'
              ? 'bg-warm-800 hover:bg-warm-700'
              : 'bg-warm-100 hover:bg-warm-200'
            }
            hover:scale-105 hover:shadow-lg
          `}
          title={theme.mode === 'light' ? 'Mode sombre' : 'Mode clair'}
        >
          {theme.mode === "light" ? (
            <MoonIcon className="h-5 w-5 text-warm-600 group-hover:text-coral-600 transition-colors" />
          ) : (
            <SunIcon className="h-5 w-5 text-hof-400 group-hover:text-hof-300 transition-colors" />
          )}
        </button>

        {/* Primary color selector */}
        <div className="relative">
          <select
            className={`
              px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer appearance-none pr-10
              ${theme.mode === 'dark'
                ? 'bg-warm-800 text-white border-warm-700 hover:border-coral-500'
                : 'bg-warm-100 text-warm-900 border-warm-200 hover:border-coral-500'
              }
              border-2 focus:outline-none focus:ring-4 focus:ring-coral-500/20
            `}
            value={theme.primary}
            onChange={(e) => setPrimary(e.target.value)}
          >
            <option value="blue"> Blue</option>
            <option value="violet">Violet</option>
            <option value="emerald">Green</option>
            <option value="amber">Orange</option>
            <option value="rose">Pink</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-warm-500' : 'text-warm-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`
              relative p-3 rounded-2xl transition-all duration-300 group
              ${theme.mode === 'dark'
                ? 'bg-warm-800 hover:bg-warm-700 text-warm-300'
                : 'bg-warm-100 hover:bg-warm-200 text-warm-700'
              }
              hover:scale-105 hover:shadow-lg
            `}
            title="Notifications"
          >
            <BellIcon className="h-5 w-5 group-hover:animate-wiggle" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-gradient-to-r from-coral-500 to-coral-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-coral-500/30 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className={`
                absolute right-0 mt-2 w-96 rounded-2xl shadow-2xl z-50 overflow-hidden
                ${theme.mode === 'dark'
                  ? 'bg-warm-900 border border-warm-700'
                  : 'bg-white border border-warm-200'
                }
              `}
            >
              {/* Header */}
              <div className={`px-4 py-3 border-b ${theme.mode === 'dark' ? 'border-warm-700' : 'border-warm-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold ${theme.mode === 'dark' ? 'text-white' : 'text-warm-900'}`}>
                      Notifications
                    </h3>
                    <p className="text-xs text-warm-500 mt-0.5">
                      {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est à jour'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-coral-500 hover:text-coral-600 font-medium flex items-center gap-1"
                    >
                      <CheckIcon className="w-3 h-3" />
                      Tout marquer lu
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-warm-500 mt-2">Chargement...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <BellIcon className={`w-12 h-12 mx-auto ${theme.mode === 'dark' ? 'text-warm-600' : 'text-warm-300'}`} />
                    <p className={`text-sm mt-2 ${theme.mode === 'dark' ? 'text-warm-400' : 'text-warm-500'}`}>
                      Aucune notification
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`
                        px-4 py-3 border-b last:border-0 transition-colors group
                        ${theme.mode === 'dark'
                          ? `border-warm-700 ${notif.read ? 'bg-warm-900' : 'bg-coral-500/10'}`
                          : `border-warm-50 ${notif.read ? 'bg-white' : 'bg-coral-50/50'}`
                        }
                        hover:${theme.mode === 'dark' ? 'bg-warm-800' : 'bg-warm-50'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationIcon(notif.type, notif.severity)}`}>
                          <BellIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${theme.mode === 'dark' ? 'text-warm-200' : 'text-warm-900'} ${!notif.read ? 'font-medium' : ''}`}>
                            {notif.message}
                          </p>
                          <p className="text-xs mt-1 text-warm-500">
                            {notif.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className={`p-1 rounded ${theme.mode === 'dark' ? 'hover:bg-warm-700' : 'hover:bg-warm-200'}`}
                              title="Marquer comme lu"
                            >
                              <CheckIcon className="w-4 h-4 text-teal-500" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notif.id)}
                            className={`p-1 rounded ${theme.mode === 'dark' ? 'hover:bg-warm-700' : 'hover:bg-warm-200'}`}
                            title="Supprimer"
                          >
                            <TrashIcon className="w-4 h-4 text-coral-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className={`px-4 py-3 border-t ${theme.mode === 'dark' ? 'border-warm-700 bg-warm-800/50' : 'border-warm-100 bg-warm-50'}`}>
                <button
                  onClick={() => window.location.href = '/alerts'}
                  className="w-full text-center text-sm text-coral-500 hover:text-coral-600 font-medium py-1"
                >
                  Voir toutes les notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UserMenu onLogout={handleLogout} />
    </div>
  );
}