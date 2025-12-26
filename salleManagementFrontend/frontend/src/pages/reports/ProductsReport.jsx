import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
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

import KpiCard from "../../components/cards/KpiCard";
import ChartCard from "../../components/cards/ChartCard";
import DataTable from "../../components/tables/DataTable";
import FilterPanel from "../../components/filters/FilterPanel";
import ExportMenu from "../../components/exports/ExportMenu";
import { analyticsApi, productsApi, categoriesApi } from "../../api";
import { useTheme } from "../../theme/ThemeProvider";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

export default function ProductsReport() {
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [filters, setFilters] = useState({});

  // Filter configuration
  const filterConfig = [
    {
      key: "categoryId",
      type: "select",
      label: "Catégorie",
      placeholder: "Toutes les catégories",
      options: categories.map((c) => ({ label: c.name, value: c.id })),
    },
    {
      key: "stockStatus",
      type: "select",
      label: "État du stock",
      placeholder: "Tous les états",
      options: [
        { label: "En stock", value: "in_stock" },
        { label: "Stock faible", value: "low_stock" },
        { label: "Rupture", value: "out_of_stock" },
      ],
    },
    {
      key: "priceRange",
      type: "range",
      label: "Prix (MAD)",
      min: 0,
      max: 5000,
      step: 50,
    },
    {
      key: "search",
      type: "search",
      label: "Recherche",
      placeholder: "Nom du produit...",
    },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProductsData();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadProductsData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.categoryId) params.categoryId = filters.categoryId;

      const [productsRes, bestRes, catStatsRes] = await Promise.all([
        productsApi.getAll(params),
        analyticsApi.getBestSellers(),
        analyticsApi.getCategoryStats(),
      ]);

      let productsData = productsRes.data || [];

      // Apply client-side filters
      if (filters.stockStatus) {
        productsData = productsData.filter((p) => {
          const stock = p.quantiteStock || p.stock || 0;
          const threshold = p.seuilAlerte || 10;
          switch (filters.stockStatus) {
            case "in_stock":
              return stock > threshold;
            case "low_stock":
              return stock > 0 && stock <= threshold;
            case "out_of_stock":
              return stock === 0;
            default:
              return true;
          }
        });
      }

      if (filters.priceRange) {
        productsData = productsData.filter((p) => {
          const price = p.prixVente || p.price || 0;
          if (filters.priceRange.min && price < filters.priceRange.min) return false;
          if (filters.priceRange.max && price > filters.priceRange.max) return false;
          return true;
        });
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        productsData = productsData.filter(
          (p) =>
            p.nom?.toLowerCase().includes(searchLower) ||
            p.name?.toLowerCase().includes(searchLower) ||
            p.reference?.toLowerCase().includes(searchLower)
        );
      }

      setProducts(productsData);
      setBestSellers(bestRes.data || []);
      setCategoryStats(catStatsRes.data || []);
    } catch (error) {
      console.error("Failed to load products data:", error);
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

  // Calculate statistics
  const stats = useMemo(() => {
    if (!products.length) {
      return {
        totalProducts: 0,
        lowStock: 0,
        outOfStock: 0,
        avgPrice: 0,
        totalValue: 0,
      };
    }

    const lowStock = products.filter((p) => {
      const stock = p.quantiteStock || p.stock || 0;
      const threshold = p.seuilAlerte || 10;
      return stock > 0 && stock <= threshold;
    }).length;

    const outOfStock = products.filter((p) => (p.quantiteStock || p.stock || 0) === 0).length;

    const totalValue = products.reduce(
      (sum, p) => sum + (p.prixVente || p.price || 0) * (p.quantiteStock || p.stock || 0),
      0
    );

    const avgPrice =
      products.reduce((sum, p) => sum + (p.prixVente || p.price || 0), 0) / products.length;

    return {
      totalProducts: products.length,
      lowStock,
      outOfStock,
      avgPrice,
      totalValue,
    };
  }, [products]);

  // Table columns
  const columns = [
    {
      header: "Produit",
      accessor: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt={row.nom || row.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{row.nom || row.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.reference || `#${row.id}`}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Catégorie",
      accessor: (row) => row.categoryName || row.categorie?.name || "-",
      sortable: true,
    },
    {
      header: "Prix",
      accessor: (row) => formatCurrency(row.prixVente || row.price),
      sortable: true,
    },
    {
      header: "Stock",
      accessor: (row) => {
        const stock = row.quantiteStock || row.stock || 0;
        const threshold = row.seuilAlerte || 10;
        const isLow = stock > 0 && stock <= threshold;
        const isOut = stock === 0;

        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              isOut
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : isLow
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}
          >
            {stock} unités
          </span>
        );
      },
      sortable: true,
    },
    {
      header: "Valeur stock",
      accessor: (row) =>
        formatCurrency((row.prixVente || row.price || 0) * (row.quantiteStock || row.stock || 0)),
      sortable: true,
    },
    {
      header: "Ventes",
      accessor: (row) => row.totalSold || row.vendu || 0,
      sortable: true,
    },
  ];

  // Export columns
  const exportColumns = [
    { header: "ID", accessor: "id" },
    { header: "Nom", accessor: (r) => r.nom || r.name },
    { header: "Référence", accessor: "reference" },
    { header: "Catégorie", accessor: (r) => r.categoryName || "-" },
    { header: "Prix", accessor: (r) => r.prixVente || r.price || 0 },
    { header: "Stock", accessor: (r) => r.quantiteStock || r.stock || 0 },
    { header: "Ventes", accessor: (r) => r.totalSold || 0 },
  ];

  // Prepare best sellers chart data
  const bestSellersData = bestSellers.slice(0, 8).map((p) => ({
    name: p.nom || p.name || `Produit ${p.id}`,
    ventes: p.totalSold || p.quantiteVendue || 0,
    ca: p.revenue || p.chiffreAffaires || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rapport Produits
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Analyse du catalogue et performances produits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProductsData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <ExportMenu
            data={products}
            columns={exportColumns}
            filename="rapport_produits"
            title="Rapport Produits"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total produits"
          value={stats.totalProducts}
          icon="products"
          color="blue"
          loading={loading}
        />
        <KpiCard
          title="Valeur stock"
          value={formatCurrency(stats.totalValue)}
          icon="revenue"
          color="green"
          loading={loading}
        />
        <KpiCard
          title="Prix moyen"
          value={formatCurrency(stats.avgPrice)}
          icon="cart"
          color="purple"
          loading={loading}
        />
        <KpiCard
          title="Stock faible"
          value={stats.lowStock}
          icon="alert"
          color="orange"
          loading={loading}
        />
        <KpiCard
          title="Rupture de stock"
          value={stats.outOfStock}
          icon="alert"
          color="red"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <ChartCard
          title="Meilleures ventes"
          subtitle="Top 8 produits"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bestSellersData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis
                type="number"
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }}
                tickFormatter={(val) => (val.length > 12 ? val.slice(0, 12) + "..." : val)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="ventes" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Ventes" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard
          title="Répartition par catégorie"
          subtitle="Distribution des produits"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryStats}
                dataKey="productCount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {categoryStats.map((entry, index) => (
                  <Cell key={entry.id || index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "8px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Attention : {stats.lowStock} produit(s) en stock faible
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Pensez à réapprovisionner ces articles pour éviter les ruptures de stock.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Products Table */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        onExport={() => {}}
        emptyMessage="Aucun produit trouvé pour les filtres sélectionnés"
        onRowClick={(row) => console.log("View product:", row.id)}
      />
    </div>
  );
}
