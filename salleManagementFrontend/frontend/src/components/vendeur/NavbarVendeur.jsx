import { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Check,
  X,
  ShoppingCart,
  Package,
  TrendingUp,
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { alertsApi } from "../../api";

export default function NavbarVendeur() {
  const { user, logout } = useUser();
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Load notifications
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await alertsApi.getAlerts();
      setNotifications(res.data.slice(0, 5));
    } catch (err) {
      console.error("Failed to load notifications");
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "SALE": return <ShoppingCart className="w-4 h-4 text-emerald-500" />;
      case "PRODUCT": return <Package className="w-4 h-4 text-blue-500" />;
      case "TREND": return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <header className="h-18 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">

      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search products, sales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none hover:border-emerald-400/50"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
          >
            <Bell className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-1 rounded-full">{unreadCount} new</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? "bg-emerald-50/50" : ""
                        }`}
                    >
                      <div className="flex gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium truncate">{notif.title || notif.message}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatTimeAgo(notif.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <button className="w-full text-center text-sm text-emerald-600 font-medium hover:text-emerald-700">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 pl-3 pr-2 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/25">
              {user?.username?.charAt(0).toUpperCase() || "V"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-900">{user?.username || "Vendeur"}</p>
              <p className="text-xs text-gray-500">Sales Agent</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfile ? "rotate-180" : ""}`} />
          </button>

          {/* Profile Menu */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{user?.username || "Vendeur"}</p>
                <p className="text-sm text-gray-500">{user?.email || "vendeur@example.com"}</p>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}