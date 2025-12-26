import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    Search,
    User,
    LogOut,
    Settings,
    ChevronDown,
    Moon,
    Sun,
    TrendingUp,
    BarChart3,
    AlertCircle,
    X,
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { alertsApi } from "../../api";

export default function AnalystNavbar() {
    const navigate = useNavigate();
    const { user, logout } = useUser();
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    const profileRef = useRef(null);
    const notifRef = useRef(null);

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
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfile(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getNotificationIcon = (type) => {
        switch (type) {
            case "TREND": return <TrendingUp className="w-4 h-4 text-purple-500" />;
            case "ANALYTICS": return <BarChart3 className="w-4 h-4 text-indigo-500" />;
            case "ALERT": return <AlertCircle className="w-4 h-4 text-red-500" />;
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
        <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
            <div className="h-full px-6 flex items-center justify-between">
                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search analytics, reports..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        {isDark ? (
                            <Sun className="w-5 h-5 text-amber-500" />
                        ) : (
                            <Moon className="w-5 h-5 text-gray-600" />
                        )}
                    </button>

                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <Bell className="w-5 h-5 text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs text-indigo-600 font-medium">{unreadCount} new</span>
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
                                                className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? "bg-indigo-50/50" : ""
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
                                    <button className="w-full text-center text-sm text-indigo-600 font-medium hover:text-indigo-700">
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
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/25">
                                {user?.username?.charAt(0).toUpperCase() || "A"}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-semibold text-gray-900">{user?.username || "Analyste"}</p>
                                <p className="text-xs text-gray-500">Data Analyst</p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfile ? "rotate-180" : ""}`} />
                        </button>

                        {/* Profile Menu */}
                        {showProfile && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-gray-100">
                                    <p className="font-semibold text-gray-900">{user?.username || "Analyste"}</p>
                                    <p className="text-sm text-gray-500">{user?.email || "analyst@example.com"}</p>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setShowProfile(false);
                                            navigate("/analyst/settings");
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Paramètres
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                                        <User className="w-4 h-4" />
                                        My Profile
                                    </button>
                                </div>
                                <div className="p-2 border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Déconnexion
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
