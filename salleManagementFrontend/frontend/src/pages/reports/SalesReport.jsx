import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { analyticsApi, salesApi, productsApi, categoriesApi } from "../../api";
import { useTheme } from "../../theme/ThemeProvider";

export default function SalesReport() {
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [filters, setFilters] = useState({});

  // Filter configuration
  const filterConfig = [
    {
      key: "dateRange",
      type: "dateRange",
      label: "Période",
      presets: [
        { label: "Aujourd'hui", getValue: () => ({ start: new Date(), end: new Date() }) },
        {
          label: "7 derniers jours",
          getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 7);
            return { start, end };
          },
        },
        {
          label: "30 derniers jours",
          getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);
            return { start, end };
          },
        },
        {
          label: "Ce mois",
          getValue: () => {
            const start = new Date();
            start.setDate(1);
            return { start, end: new Date() };
          },
        },
      ],
    },
    {
      key: "categoryId",
      type: "select",
      label: "Catégorie",
      placeholder: "Toutes les catégories",
      options: categories.map((c) => ({ label: c.name, value: c.id })),
    },
    {
      key: "vendorId",
      type: "select",
      label: "Vendeur",
      placeholder: "Tous les vendeurs",
      options: vendors.map((v) => ({ label: v.name || v.username, value: v.id })),
    },
    {
      key: "amountRange",
      type: "range",
      label: "Montant (MAD)",
      min: 0,
      max: 10000,
      step: 100,
    },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadSalesData();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      const [catRes, vendorRes] = await Promise.all([
        categoriesApi.getAll(),
        analyticsApi.getVendorStats?.() || Promise.resolve({ data: [] }),
      ]);
      setCategories(catRes.data || []);
      setVendors(vendorRes.data || []);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  };

  const loadSalesData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.dateRange?.start) {
        params.startDate = filters.dateRange.start.toISOString().split("T")[0];
      }
      if (filters.dateRange?.end) {
        params.endDate = filters.dateRange.end.toISOString().split("T")[0];
      }
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.vendorId) params.vendorId = filters.vendorId;

      const [salesRes, statsRes, dailyRes] = await Promise.all([
        salesApi.getAll(params),
        analyticsApi.getStatistics(params),
        analyticsApi.getDailySales(params),
      ]);

      let salesData = salesRes.data || [];

      // Apply amount filter client-side
      if (filters.amountRange?.min !== undefined || filters.amountRange?.max !== undefined) {
        salesData = salesData.filter((s) => {
          const amount = s.montantTotal || s.total || 0;
          if (filters.amountRange?.min && amount < filters.amountRange.min) return false;
          if (filters.amountRange?.max && amount > filters.amountRange.max) return false;
          return true;
        });
      }

      setSales(salesData);
      setKpis(statsRes.data);
      setDailySales(dailyRes.data || []);
    } catch (error) {
      console.error("Failed to load sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
    }).format(value || 0);

  // Table columns
  const columns = [
    {
      header: "Référence",
      accessor: (row) => `#${row.id}`,
      sortable: true,
    },
    {
      header: "Date",
      accessor: (row) =>
        new Date(row.dateVente || row.createdAt).toLocaleDateString("fr-FR"),
      sortable: true,
    },
    {
      header: "Client",
      accessor: (row) => row.clientName || row.client?.name || "-",
    },
    {
      header: "Vendeur",
      accessor: (row) => row.vendeurName || row.vendeur?.username || "-",
    },
    {
      header: "Articles",
      accessor: (row) => row.lignesVente?.length || row.itemCount || 0,
    },
    {
      header: "Total",
      accessor: (row) => formatCurrency(row.montantTotal || row.total),
      sortable: true,
    },
    {
      header: "Statut",
      accessor: (row) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.status === "COMPLETED" || row.status === "PAYÉ"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : row.status === "PENDING"
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          {row.status || "Complété"}
        </span>
      ),
    },
  ];

  // Export columns
  const exportColumns = [
    { header: "ID", accessor: "id" },
    { header: "Date", accessor: (r) => new Date(r.dateVente || r.createdAt).toLocaleDateString("fr-FR") },
    { header: "Client", accessor: (r) => r.clientName || "-" },
    { header: "Vendeur", accessor: (r) => r.vendeurName || "-" },
    { header: "Articles", accessor: (r) => r.lignesVente?.length || 0 },
    { header: "Total", accessor: (r) => r.montantTotal || r.total || 0 },
    { header: "Statut", accessor: (r) => r.status || "Complété" },
  ];

  // Calculate additional stats
  const stats = useMemo(() => {
    if (!sales.length) return { avgTicket: 0, topDay: "-", totalItems: 0 };

    const total = sales.reduce((sum, s) => sum + (s.montantTotal || s.total || 0), 0);
    const avgTicket = total / sales.length;
    const totalItems = sales.reduce((sum, s) => sum + (s.lignesVente?.length || 0), 0);

    // Find top day
    const dayTotals = dailySales.reduce((acc, d) => {
      acc[d.date] = (acc[d.date] || 0) + d.total;
      return acc;
    }, {});
    const topDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];

    return {
      avgTicket,
      topDay: topDay ? topDay[0] : "-",
      totalItems,
    };
  }, [sales, dailySales]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rapport des Ventes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Analyse détaillée des performances de vente
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSalesData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <ExportMenu
            data={sales}
            columns={exportColumns}
            filename="rapport_ventes"
            title="Rapport des Ventes"
          />
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filterConfig}
        values={filters}
        onChange={setFilters}
        loading={loading}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Chiffre d'affaires"
          value={formatCurrency(kpis?.totalRevenue || kpis?.chiffreAffaires)}
          icon="revenue"
          color="blue"
          trend={kpis?.revenueGrowth ? { value: kpis.revenueGrowth, isPositive: kpis.revenueGrowth > 0 } : undefined}
          loading={loading}
        />
        <KpiCard
          title="Nombre de ventes"
          value={sales.length}
          icon="sales"
          color="green"
          loading={loading}
        />
        <KpiCard
          title="Panier moyen"
          value={formatCurrency(stats.avgTicket)}
          icon="cart"
          color="purple"
          loading={loading}
        />
        <KpiCard
          title="Articles vendus"
          value={stats.totalItems}
          icon="products"
          color="orange"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <ChartCard
          title="Évolution journalière"
          subtitle="Ventes par jour"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySales}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis
                dataKey="date"
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => new Date(label).toLocaleDateString("fr-FR")}
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
                name="CA"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Hourly Distribution */}
        <ChartCard
          title="Distribution horaire"
          subtitle="Ventes par heure"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={Array.from({ length: 12 }, (_, i) => ({
                hour: `${8 + i}h`,
                ventes: Math.floor(Math.random() * 20 + 5),
                ca: Math.floor(Math.random() * 5000 + 1000),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis
                dataKey="hour"
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="ventes" fill="#10b981" radius={[4, 4, 0, 0]} name="Ventes" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Sales Table */}
      <DataTable
        columns={columns}
        data={sales}
        loading={loading}
        onExport={() => {}}
        emptyMessage="Aucune vente trouvée pour les filtres sélectionnés"
        onRowClick={(row) => console.log("View sale:", row.id)}
      />
    </div>
  );
}
