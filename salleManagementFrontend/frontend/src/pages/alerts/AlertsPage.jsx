import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Filter,
  RefreshCw,
  Trash2,
  Check,
  Clock,
} from "lucide-react";

import { alertsApi } from "../../api";
import { useAuth } from "../../auth";
import { useTheme } from "../../theme/ThemeProvider";

const SEVERITY_CONFIG = {
  HIGH: {
    icon: AlertTriangle,
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800/30",
    iconColor: "text-red-600 dark:text-red-400",
    textColor: "text-red-800 dark:text-red-200",
    badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    label: "Critique",
  },
  MEDIUM: {
    icon: AlertCircle,
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-800/30",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    textColor: "text-yellow-800 dark:text-yellow-200",
    badge: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    label: "Important",
  },
  LOW: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    textColor: "text-blue-800 dark:text-blue-200",
    badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    label: "Info",
  },
};

const ALERT_TYPES = {
  LOW_STOCK: { label: "Stock faible", icon: AlertTriangle },
  SALES_DROP: { label: "Baisse des ventes", icon: AlertCircle },
  TARGET_ACHIEVED: { label: "Objectif atteint", icon: CheckCircle },
  NEW_ORDER: { label: "Nouvelle commande", icon: Bell },
  SYSTEM: { label: "Système", icon: Info },
};

export default function AlertsPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await alertsApi.getByRole(user?.role || "ADMIN");
      setAlerts(res.data || []);
    } catch (error) {
      console.error("Failed to load alerts:", error);
      // Demo alerts for testing
      setAlerts([
        {
          id: 1,
          type: "LOW_STOCK",
          message: "Le produit 'iPhone 15 Pro' a un stock faible (5 unités)",
          severity: "HIGH",
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          type: "SALES_DROP",
          message: "Les ventes ont diminué de 15% cette semaine",
          severity: "MEDIUM",
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 3,
          type: "TARGET_ACHIEVED",
          message: "Objectif mensuel de 50 000 MAD atteint !",
          severity: "LOW",
          read: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await alertsApi.markAsRead?.(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await alertsApi.markAllAsRead?.();
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await alertsApi.delete?.(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error("Failed to delete alert:", error);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "unread" && alert.read) return false;
    if (filter === "read" && !alert.read) return false;
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Bell className="w-7 h-7" />
            Alertes
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-sm font-bold bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos notifications et alertes système
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAlerts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Read/Unread filter */}
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          {[
            { key: "all", label: "Toutes" },
            { key: "unread", label: "Non lues" },
            { key: "read", label: "Lues" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === f.key
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Severity filter */}
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          {[
            { key: "all", label: "Toutes", color: "gray" },
            { key: "HIGH", label: "Critiques", color: "red" },
            { key: "MEDIUM", label: "Importantes", color: "yellow" },
            { key: "LOW", label: "Info", color: "blue" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setSeverityFilter(f.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                severityFilter === f.key
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-24 bg-gray-100 dark:bg-slate-800 rounded-xl"
            />
          ))
        ) : filteredAlerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune alerte
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === "unread"
                ? "Vous n'avez pas d'alertes non lues"
                : "Aucune alerte ne correspond à vos filtres"}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredAlerts.map((alert) => {
              const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.LOW;
              const Icon = config.icon;
              const typeConfig = ALERT_TYPES[alert.type] || ALERT_TYPES.SYSTEM;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  layout
                  className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 transition-all ${
                    !alert.read ? "ring-2 ring-offset-2 ring-blue-500/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.badge}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {typeConfig.label}
                        </span>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>

                      <p className={`font-medium ${config.textColor}`}>
                        {alert.message}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(alert.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!alert.read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Marquer comme lu"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Stats Summary */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {alerts.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total alertes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {alerts.filter((a) => a.severity === "HIGH").length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Critiques</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {alerts.filter((a) => a.severity === "MEDIUM").length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Importantes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {unreadCount}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Non lues</p>
          </div>
        </div>
      )}
    </div>
  );
}
