import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Tag,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";

import KpiCard from "../../components/cards/KpiCard";
import ChartCard from "../../components/cards/ChartCard";
import DataTable from "../../components/tables/DataTable";
import { CardSkeleton, ChartSkeleton } from "../../components/common/LoadingScreen";
import { analyticsApi, salesApi, productsApi, alertsApi } from "../../api";
import { useTheme } from "../../theme/ThemeProvider";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        kpiRes,
        salesRes,
        categoryRes,
        bestSellersRes,
        lowStockRes,
        alertsRes,
        recentSalesRes,
      ] = await Promise.all([
        analyticsApi.getKPI(),
        analyticsApi.getDailySales(getDateRange().start, getDateRange().end),
        analyticsApi.getCategoryStats(),
        analyticsApi.getBestSellers(5),
        analyticsApi.getLowStock(5),
        alertsApi.getUnread(),
        salesApi.getPaginated(0, 5),
      ]);

      setKpis(kpiRes.data);
      setSalesData(salesRes.data || []);
      setCategoryStats(categoryRes.data || []);
      setBestSellers(bestSellersRes.data || []);
      setLowStock(lowStockRes.data || []);
      setAlerts(alertsRes.data?.slice(0, 5) || []);
      setRecentSales(recentSalesRes.data?.content || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  // Table columns for recent sales
  const salesColumns = [
    { header: "ID", accessor: "id" },
    { header: "Date", accessor: "date", render: (val) => new Date(val).toLocaleDateString("fr-FR") },
    { header: "Total", accessor: "total", render: (val) => formatCurrency(val) },
    { header: "Statut", accessor: "status", render: (val) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        val === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
        val === "CANCELLED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      }`}>
        {val === "COMPLETED" ? "Complété" : val === "CANCELLED" ? "Annulé" : "En cours"}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Chiffre d'affaires"
          value={formatCurrency(kpis?.totalRevenue)}
          icon="revenue"
          color="green"
          trend={kpis?.revenueTrend ? { value: kpis.revenueTrend, isPositive: kpis.revenueTrend > 0 } : null}
          loading={loading}
        />
        <KpiCard
          title="Ventes totales"
          value={kpis?.totalSales || 0}
          icon="sales"
          color="blue"
          trend={kpis?.salesTrend ? { value: kpis.salesTrend, isPositive: kpis.salesTrend > 0 } : null}
          loading={loading}
        />
        <KpiCard
          title="Produits actifs"
          value={kpis?.activeProducts || 0}
          icon="products"
          color="purple"
          loading={loading}
        />
        <KpiCard
          title="Catégories"
          value={kpis?.totalCategories || 0}
          icon="categories"
          color="orange"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <ChartCard
          title="Évolution des ventes"
          subtitle="30 derniers jours"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis
                dataKey="date"
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                tickFormatter={(val) => new Date(val).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              />
              <YAxis tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorSales)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Distribution Chart */}
        <ChartCard
          title="Répartition par catégorie"
          subtitle="CA par catégorie"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryStats}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {categoryStats.map((entry, index) => (
                  <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Best Sellers & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <ChartCard
          title="Meilleures ventes"
          subtitle="Top 5 produits"
          loading={loading}
          actions={
            <button
              onClick={() => navigate("/analytics/products")}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </button>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bestSellers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis type="number" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="quantitySold" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Low Stock Alert */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Stock faible</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Produits à réapprovisionner</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/products?filter=low-stock")}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : lowStock.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Tous les produits sont en stock</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStock.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {product.stock} unités
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Min: {product.minStock}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Ventes récentes</h3>
              <button
                onClick={() => navigate("/sales")}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Voir tout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <DataTable
              columns={salesColumns}
              data={recentSales}
              loading={loading}
              pagination={false}
              searchable={false}
              onRowClick={(row) => navigate(`/sales/${row.id}`)}
            />
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Alertes</h3>
            <button
              onClick={() => navigate("/alerts")}
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
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Aucune alerte</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.severity === "HIGH"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                        : alert.severity === "MEDIUM"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(alert.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
