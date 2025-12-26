import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Package,
  AlertTriangle,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import KpiCard from "../../components/cards/KpiCard";
import ChartCard from "../../components/cards/ChartCard";
import { useAuth } from "../../auth";
import { analyticsApi, salesApi } from "../../api";
import { useTheme } from "../../theme/ThemeProvider";

export default function VendeurDashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { userId, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [kpiRes, dailyRes, bestSellersRes, salesRes] = await Promise.all([
        analyticsApi.getVendeurKPI(),
        analyticsApi.getVendeurDailySales(),
        analyticsApi.getVendeurBestSellers(5),
        salesApi.getPaginated(0, 5),
      ]);

      setKpis(kpiRes.data);
      setDailySales(dailyRes.data || []);
      setBestSellers(bestSellersRes.data || []);
      setRecentSales(salesRes.data?.content || []);
    } catch (error) {
      console.error("Failed to load vendeur dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  // Today's stats from kpis
  const todayStats = {
    sales: kpis?.todaySales || 0,
    revenue: kpis?.todayRevenue || 0,
    target: kpis?.dailyTarget || 0,
    progress: kpis?.dailyTarget ? Math.round((kpis.todayRevenue / kpis.dailyTarget) * 100) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bonjour, {user?.username || "Vendeur"} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Voici un aperçu de vos performances
          </p>
        </div>

        <button
          onClick={() => navigate("/vendeur/sales/new")}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Nouvelle vente
        </button>
      </div>

      {/* Today's Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium opacity-90">Objectif du jour</p>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl font-bold">{formatCurrency(todayStats.revenue)}</span>
              <span className="text-lg opacity-75">/ {formatCurrency(todayStats.target)}</span>
            </div>
            <p className="text-sm mt-2 opacity-90">
              {todayStats.sales} ventes aujourd'hui
            </p>
          </div>

          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression</span>
              <span className="text-sm font-bold">{todayStats.progress}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(todayStats.progress, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  todayStats.progress >= 100
                    ? "bg-green-400"
                    : todayStats.progress >= 75
                    ? "bg-yellow-400"
                    : "bg-white"
                }`}
              />
            </div>
            {todayStats.progress >= 100 && (
              <p className="text-sm mt-2 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Objectif atteint ! 🎉
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="CA ce mois"
          value={formatCurrency(kpis?.monthlyRevenue)}
          icon="revenue"
          color="green"
          trend={kpis?.monthlyTrend ? { value: kpis.monthlyTrend, isPositive: kpis.monthlyTrend > 0 } : null}
          loading={loading}
        />
        <KpiCard
          title="Ventes ce mois"
          value={kpis?.monthlySales || 0}
          icon="sales"
          color="blue"
          loading={loading}
        />
        <KpiCard
          title="Panier moyen"
          value={formatCurrency(kpis?.averageBasket)}
          icon="trending"
          color="purple"
          loading={loading}
        />
        <KpiCard
          title="Produits vendus"
          value={kpis?.productsSold || 0}
          icon="products"
          color="orange"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <ChartCard
          title="Mes ventes"
          subtitle="7 derniers jours"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySales}>
              <defs>
                <linearGradient id="colorVendeur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis
                dataKey="date"
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                tickFormatter={(val) => new Date(val).toLocaleDateString("fr-FR", { weekday: "short" })}
              />
              <YAxis tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorVendeur)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Best Sellers */}
        <ChartCard
          title="Mes meilleures ventes"
          subtitle="Top 5 produits"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bestSellers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis type="number" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="quantitySold" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Sales */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Mes dernières ventes</h3>
          <button
            onClick={() => navigate("/vendeur/sales")}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune vente récente</p>
              <button
                onClick={() => navigate("/vendeur/sales/new")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer une vente
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => navigate(`/vendeur/sales/${sale.id}`)}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      sale.status === "COMPLETED"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : sale.status === "CANCELLED"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-yellow-100 dark:bg-yellow-900/30"
                    }`}>
                      <ShoppingCart className={`w-6 h-6 ${
                        sale.status === "COMPLETED"
                          ? "text-green-600 dark:text-green-400"
                          : sale.status === "CANCELLED"
                          ? "text-red-600 dark:text-red-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Vente #{sale.id}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(sale.date).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(sale.total)}
                    </p>
                    <p className={`text-xs font-medium ${
                      sale.status === "COMPLETED"
                        ? "text-green-600 dark:text-green-400"
                        : sale.status === "CANCELLED"
                        ? "text-red-600 dark:text-red-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }`}>
                      {sale.status === "COMPLETED" ? "Complété" : sale.status === "CANCELLED" ? "Annulé" : "En cours"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
