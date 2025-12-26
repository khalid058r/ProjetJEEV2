import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Filter,
  Download,
  Save,
  RefreshCw,
  Eye,
  Layers,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import KpiCard from "../../components/cards/KpiCard";
import ChartCard from "../../components/cards/ChartCard";
import DataTable from "../../components/tables/DataTable";
import FilterPanel from "../../components/filters/FilterPanel";
import ExportMenu from "../../components/exports/ExportMenu";
import { analyticsApi, productsApi, categoriesApi, salesApi } from "../../api";
import { useTheme } from "../../theme/ThemeProvider";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

// Filter configuration
const FILTER_CONFIG = [
  {
    key: "dateRange",
    label: "Période",
    type: "dateRange",
  },
  {
    key: "category",
    label: "Catégorie",
    type: "select",
    multiple: true,
    options: [], // Will be populated dynamically
    placeholder: "Toutes les catégories",
  },
  {
    key: "priceRange",
    label: "Prix",
    type: "range",
    min: 0,
    max: 10000,
    prefix: "DH",
  },
  {
    key: "minRating",
    label: "Note minimum",
    type: "select",
    options: [
      { value: 0, label: "Toutes les notes" },
      { value: 3, label: "3+ ⭐" },
      { value: 4, label: "4+ ⭐" },
      { value: 4.5, label: "4.5+ ⭐" },
    ],
  },
  {
    key: "vendor",
    label: "Vendeur",
    type: "select",
    multiple: true,
    options: [], // Will be populated dynamically
    placeholder: "Tous les vendeurs",
  },
];

export default function AnalystWorkspace() {
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview"); // overview, products, categories, sales, vendors
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({ categories: [], vendors: [] });

  // Data states
  const [kpis, setKpis] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [productAnalytics, setProductAnalytics] = useState([]);
  const [vendorPerformance, setVendorPerformance] = useState([]);
  const [comparison, setComparison] = useState({ current: 0, previous: 0, change: 0 });

  useEffect(() => {
    loadFilterOptions();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters, activeView]);

  const loadFilterOptions = async () => {
    try {
      const [categoriesRes, usersRes] = await Promise.all([
        categoriesApi.getAll(),
        // Assuming we have a way to get vendors
      ]);

      setFilterOptions({
        categories: (categoriesRes.data || []).map((c) => ({ value: c.id, label: c.name })),
        vendors: [], // Would be populated from users API
      });
    } catch (error) {
      console.error("Failed to load filter options:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const dateRange = filters.dateRange || getDefaultDateRange();

      const [kpiRes, salesRes, categoryRes, productsRes] = await Promise.all([
        analyticsApi.getKPI(),
        analyticsApi.getDailySales(dateRange.start, dateRange.end),
        analyticsApi.getCategoryStats(),
        analyticsApi.getBestSellers(20),
      ]);

      setKpis(kpiRes.data);
      setSalesTrend(salesRes.data || []);
      setCategoryStats(categoryRes.data || []);
      setProductAnalytics(productsRes.data || []);

      // Calculate comparison
      const current = salesRes.data?.reduce((sum, d) => sum + (d.total || 0), 0) || 0;
      const previous = kpiRes.data?.previousPeriodRevenue || current * 0.9;
      setComparison({
        current,
        previous,
        change: previous ? Math.round(((current - previous) / previous) * 100) : 0,
      });
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD", minimumFractionDigits: 0 }).format(value || 0);

  // Dynamic filter config with loaded options
  const dynamicFilters = useMemo(() => {
    return FILTER_CONFIG.map((f) => {
      if (f.key === "category") {
        return { ...f, options: filterOptions.categories };
      }
      if (f.key === "vendor") {
        return { ...f, options: filterOptions.vendors };
      }
      return f;
    });
  }, [filterOptions]);

  // Export columns for products
  const productExportColumns = [
    { header: "Produit", accessor: "name" },
    { header: "Catégorie", accessor: "category" },
    { header: "Prix", accessor: "price" },
    { header: "Quantité vendue", accessor: "quantitySold" },
    { header: "CA", accessor: "revenue" },
  ];

  // View tabs
  const views = [
    { id: "overview", label: "Vue d'ensemble", icon: Layers },
    { id: "products", label: "Produits", icon: BarChart3 },
    { id: "categories", label: "Catégories", icon: PieChart },
    { id: "sales", label: "Ventes", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analyst Workspace
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Analyse approfondie et aide à la décision
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {/* Save view */ }}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Sauvegarder vue
          </button>

          <ExportMenu
            data={productAnalytics}
            columns={productExportColumns}
            filename="analyst_export"
            title="Rapport Analyste"
          />

          <button
            onClick={loadData}
            className="p-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === view.id
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <Icon className="w-4 h-4" />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <FilterPanel
        filters={dynamicFilters}
        values={filters}
        onChange={setFilters}
        onReset={() => setFilters({})}
      />

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Période actuelle</p>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(comparison.current)}
          </p>
          <div className={`flex items-center gap-1 mt-2 text-sm ${comparison.change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}>
            {comparison.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
            {comparison.change >= 0 ? "+" : ""}{comparison.change}% vs période précédente
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Période précédente</p>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(comparison.previous)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Base de comparaison
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl p-6 shadow-sm ${comparison.change >= 0
            ? "bg-gradient-to-br from-green-500 to-emerald-600"
            : "bg-gradient-to-br from-red-500 to-rose-600"
            } text-white`}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium opacity-90">Évolution</p>
            {comparison.change >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5 rotate-180" />
            )}
          </div>
          <p className="text-4xl font-bold">
            {comparison.change >= 0 ? "+" : ""}{comparison.change}%
          </p>
          <p className="text-sm opacity-90 mt-2">
            {comparison.change >= 0 ? "Croissance positive" : "Décroissance"}
          </p>
        </motion.div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <ChartCard
          title="Tendance des ventes"
          subtitle="Évolution sur la période"
          loading={loading}
          className="lg:col-span-2"
          height="h-96"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="colorAnalyst" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(val) => new Date(val).toLocaleDateString("fr-FR")}
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
                fill="url(#colorAnalyst)"
                strokeWidth={2}
                name="CA"
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Nb ventes"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard
          title="Répartition par catégorie"
          subtitle="Part de CA"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={categoryStats}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
            </RePieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Product Performance */}
        <ChartCard
          title="Performance produits"
          subtitle="Top 10 par CA"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productAnalytics.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis type="number" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === "revenue" ? formatCurrency(value) : value,
                  name === "revenue" ? "CA" : "Quantité"
                ]}
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="quantitySold" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Quantité" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Analyse détaillée des produits</h3>
        </div>
        <DataTable
          columns={[
            { header: "Produit", accessor: "name" },
            { header: "Catégorie", accessor: "category" },
            { header: "Prix unitaire", accessor: "price", render: (val) => formatCurrency(val) },
            { header: "Qté vendue", accessor: "quantitySold" },
            { header: "CA généré", accessor: "revenue", render: (val) => formatCurrency(val) },
            { header: "Marge", accessor: "margin", render: (val) => val ? `${val}%` : "-" },
            {
              header: "Tendance", accessor: "trend", render: (val) => (
                <span className={`flex items-center gap-1 ${val > 0 ? "text-green-600 dark:text-green-400" :
                  val < 0 ? "text-red-600 dark:text-red-400" :
                    "text-gray-500"
                  }`}>
                  {val > 0 ? <TrendingUp className="w-4 h-4" /> : val < 0 ? <TrendingUp className="w-4 h-4 rotate-180" /> : "-"}
                  {val ? `${val > 0 ? "+" : ""}${val}%` : ""}
                </span>
              )
            },
          ]}
          data={productAnalytics}
          loading={loading}
          searchable
          searchPlaceholder="Rechercher un produit..."
          exportable
          onExport={() => {/* Export handled by ExportMenu above */ }}
          pageSize={10}
        />
      </div>
    </div>
  );
}
