import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    Search,
    User,
    LogOut,
    Settings,
    ChevronDown,
    TrendingUp,
    BarChart3,
    AlertCircle,
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useDarkMode } from "../../context/DarkModeContext";
import { alertsApi } from "../../api";

export default function AnalystNavbar() {
    const navigate = useNavigate();
    const { user, logout } = useUser();
    const { darkMode } = useDarkMode();
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
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
            case "TREND": return <TrendingUp className="w-4 h-4 text-coral-500" />;
            case "ANALYTICS": return <BarChart3 className="w-4 h-4 text-teal-500" />;
            case "ALERT": return <AlertCircle className="w-4 h-4 text-coral-600" />;
            default: return <Bell className="w-4 h-4 text-warm-500" />;
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
        <header className={`
            h-16 border-b sticky top-0 z-40 backdrop-blur-xl
            ${darkMode
                ? 'bg-warm-900/80 border-warm-800'
                : 'bg-white/80 border-warm-200'
            }
        `}>
            <div className="h-full px-6 flex items-center justify-between">
                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-warm-400' : 'text-warm-400'}`} />
                        <input
                            type="text"
                            placeholder="Search analytics, reports..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`
                                w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all
                                focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent
                                ${darkMode
                                    ? 'bg-warm-800 border-warm-700 text-white placeholder-warm-400 focus:bg-warm-700'
                                    : 'bg-warm-50 border-warm-200 text-warm-900 placeholder-warm-400 focus:bg-white'
                                }
                                border
                            `}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`
                                relative p-2.5 rounded-xl transition-colors
                                ${darkMode
                                    ? 'bg-warm-800 hover:bg-warm-700 text-warm-300'
                                    : 'bg-warm-50 hover:bg-warm-100 text-warm-600'
                                }
                            `}
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className={`
                                absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border overflow-hidden 
                                animate-in fade-in slide-in-from-top-2 duration-200
                                ${darkMode
                                    ? 'bg-warm-900 border-warm-700'
                                    : 'bg-white border-warm-100'
                                }
                            `}>
                                <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-warm-700' : 'border-warm-100'}`}>
                                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs text-coral-500 font-medium">{unreadCount} new</span>
                                    )}
                                </div>
                                <div className="max-h-72 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className={`p-8 text-center ${darkMode ? 'text-warm-400' : 'text-warm-400'}`}>
                                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No notifications</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={`
                                                    p-4 border-b cursor-pointer transition-colors
                                                    ${darkMode
                                                        ? `border-warm-800 hover:bg-warm-800 ${!notif.read ? "bg-coral-500/10" : ""}`
                                                        : `border-warm-50 hover:bg-warm-50 ${!notif.read ? "bg-coral-50/50" : ""}`
                                                    }
                                                `}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-warm-800' : 'bg-warm-100'}`}>
                                                        {getNotificationIcon(notif.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                                                            {notif.title || notif.message}
                                                        </p>
                                                        <p className={`text-xs mt-0.5 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
                                                            {formatTimeAgo(notif.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className={`p-3 border-t ${darkMode ? 'bg-warm-800 border-warm-700' : 'bg-warm-50 border-warm-100'}`}>
                                    <button className="w-full text-center text-sm text-coral-500 font-medium hover:text-coral-600">
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
                            className={`
                                flex items-center gap-3 pl-3 pr-2 py-2 rounded-xl transition-colors
                                ${darkMode ? 'hover:bg-warm-800' : 'hover:bg-warm-50'}
                            `}
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-coral-400 to-coral-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-coral-500/25">
                                {user?.username?.charAt(0).toUpperCase() || "A"}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                                    {user?.username || "Analyste"}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Data Analyst</p>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${darkMode ? 'text-warm-400' : 'text-warm-400'} ${showProfile ? "rotate-180" : ""}`} />
                        </button>

                        {/* Profile Menu */}
                        {showProfile && (
                            <div className={`
                                absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border overflow-hidden 
                                animate-in fade-in slide-in-from-top-2 duration-200
                                ${darkMode ? 'bg-warm-900 border-warm-700' : 'bg-white border-warm-100'}
                            `}>
                                <div className={`p-4 border-b ${darkMode ? 'border-warm-700' : 'border-warm-100'}`}>
                                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                                        {user?.username || "Analyste"}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
                                        {user?.email || "analyst@example.com"}
                                    </p>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setShowProfile(false);
                                            navigate("/analyst/settings");
                                        }}
                                        className={`
                                            w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors
                                            ${darkMode
                                                ? 'text-warm-300 hover:bg-warm-800'
                                                : 'text-warm-700 hover:bg-warm-50'
                                            }
                                        `}
                                    >
                                        <Settings className="w-4 h-4" />
                                        Paramètres
                                    </button>
                                    <button className={`
                                        w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors
                                        ${darkMode
                                            ? 'text-warm-300 hover:bg-warm-800'
                                            : 'text-warm-700 hover:bg-warm-50'
                                        }
                                    `}>
                                        <User className="w-4 h-4" />
                                        My Profile
                                    </button>
                                </div>
                                <div className={`p-2 border-t ${darkMode ? 'border-warm-700' : 'border-warm-100'}`}>
                                    <button
                                        onClick={handleLogout}
                                        className={`
                                            w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors
                                            ${darkMode
                                                ? 'text-coral-400 hover:bg-coral-500/10'
                                                : 'text-coral-600 hover:bg-coral-50'
                                            }
                                        `}
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
