import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  Package,
  Users,
  Calendar,
  Target,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import AnalyticsService from "../../services/analyticsService";
import { getSales } from "../../services/salesService";
import { useDarkMode } from "../../context/DarkModeContext";


export default function VendeurDashboard() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  const [kpi, setKpi] = useState(null);
  const [bestProducts, setBestProducts] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - 7);

      const format = (d) => d.toISOString().split("T")[0];

      // Load all data in parallel
      const [kpiRes, bestRes, dailyRes, salesRes] = await Promise.all([
        AnalyticsService.getVendeurKPI().catch(() => AnalyticsService.getGlobalKpi()),
        AnalyticsService.getVendeurBestSellers(5).catch(() => AnalyticsService.getBestSellers(5)),
        AnalyticsService.getVendeurDailySales().catch(() =>
          AnalyticsService.getDailySales(format(start), format(today))
        ),
        getSales().catch(() => ({ data: [] })),
      ]);

      // Set KPI with fallback
      const kpiData = kpiRes?.data || {
        sales: { totalRevenue: 0, salesCount: 0, averageBasket: 0 },
        products: { totalProducts: 0 }
      };
      setKpi(kpiData);

      // Set best products
      setBestProducts(Array.isArray(bestRes?.data) ? bestRes.data : []);

      // Set daily sales
      setSalesByDay(Array.isArray(dailyRes?.data) ? dailyRes.data : []);

      // Set recent sales (last 5)
      const allSales = Array.isArray(salesRes?.data) ? salesRes.data : [];
      const sortedSales = allSales
        .sort((a, b) => new Date(b.saleDate || b.createdAt) - new Date(a.saleDate || a.createdAt))
        .slice(0, 5);
      setRecentSales(sortedSales);

    } catch (err) {
      console.error("Dashboard error", err);
      setError("Erreur de chargement des données");
      // Set default values on error
      setKpi({
        sales: { totalRevenue: 0, salesCount: 0, averageBasket: 0 },
        products: { totalProducts: 0 }
      });
    }

    setLoading(false);
  };


  if (loading || !kpi) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-coral-50/20'}`}>
        <div className="relative">
          <div className={`w-16 h-16 border-4 ${darkMode ? 'border-coral-900' : 'border-coral-200'} rounded-full animate-pulse`}></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin"></div>
          <ShoppingCart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-coral-500" />
        </div>
        <p className={`mt-4 font-medium ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>Loading your dashboard...</p>
      </div>
    );
  }

  // Calculate trends
  const todayRevenue = salesByDay.length > 0 ? salesByDay[salesByDay.length - 1]?.revenue || 0 : 0;
  const yesterdayRevenue = salesByDay.length > 1 ? salesByDay[salesByDay.length - 2]?.revenue || 0 : 0;
  const revenueTrend = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : 0;

  // Stats cards data with Airbnb colors
  const statsCards = [
    {
      title: "Total Revenue",
      value: `$${kpi.sales.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "coral",
      trend: revenueTrend,
      trendUp: revenueTrend >= 0,
    },
    {
      title: "Total Sales",
      value: kpi.sales.salesCount,
      icon: ShoppingCart,
      color: "teal",
      trend: 12,
      trendUp: true,
    },
    {
      title: "Average Basket",
      value: `$${kpi.sales.averageBasket.toFixed(2)}`,
      icon: Target,
      color: "arches",
      trend: 5.2,
      trendUp: true,
    },
    {
      title: "Products Sold",
      value: kpi.products?.totalProducts || bestProducts.reduce((acc, p) => acc + (p.quantitySold || 0), 0),
      icon: Package,
      color: "hof",
      trend: 8,
      trendUp: true,
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  return (
    <div className={`min-h-screen p-6 lg:p-8 ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-coral-50/20'}`}>

      {/* ================= HEADER ================= */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-coral-500 to-coral-600 rounded-xl shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>
              Seller Dashboard
            </h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${darkMode
                ? 'bg-warm-900 border-warm-700 text-warm-300 hover:bg-warm-800'
                : 'bg-white border-warm-200 text-warm-600 hover:bg-warm-50'
              }`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <p className={`ml-14 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
          Track your sales performance and grow your business
        </p>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <KPICard key={index} {...card} darkMode={darkMode} />
        ))}
      </div>

      {/* ================= CHARTS ROW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Revenue Chart */}
        <div className={`lg:col-span-2 rounded-2xl p-6 shadow-lg border ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>Revenue Trend</h2>
              <p className={`text-sm ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Last 7 days performance</p>
            </div>
            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
              <Calendar className="w-4 h-4" />
              <span>Weekly View</span>
            </div>
          </div>

          {salesByDay.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-64 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>
              <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
              <p>No sales data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="vendeurRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#404040' : '#E5E5E5'} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 12 }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en', { weekday: 'short' })}
                />
                <YAxis tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#262626' : 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF5A5F"
                  strokeWidth={3}
                  fill="url(#vendeurRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Best Products */}
        <div className={`rounded-2xl p-6 shadow-lg border ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-hof-500" />
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>Top Products</h2>
          </div>

          {bestProducts.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-48 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>
              <Package className="w-12 h-12 mb-3 opacity-50" />
              <p>No products data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bestProducts.slice(0, 5).map((p, idx) => (
                <div
                  key={p.productId}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer ${darkMode
                      ? 'bg-warm-800 hover:bg-warm-700'
                      : 'bg-warm-50 hover:bg-coral-50'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-hof-100 text-hof-700' :
                      idx === 1 ? 'bg-warm-200 text-warm-700' :
                        idx === 2 ? 'bg-arches-100 text-arches-700' :
                          darkMode ? 'bg-warm-700 text-warm-300' : 'bg-warm-100 text-warm-600'
                    }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-warm-900'}`}>{p.productName}</p>
                    <p className={`text-xs ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>{p.quantitySold || 0} sold</p>
                  </div>
                  <p className="font-bold text-teal-500">${p.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= RECENT SALES ================= */}
      <div className={`rounded-2xl p-6 shadow-lg border ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-coral-500" />
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>Recent Sales</h2>
          </div>
          <button
            onClick={() => navigate("/vendeur/sales")}
            className="flex items-center gap-2 text-coral-500 text-sm font-medium hover:text-coral-600 transition-colors px-4 py-2 rounded-lg hover:bg-coral-50"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentSales.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-12 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>
            <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No recent sales</p>
            <p className="text-sm">Start selling to see your transactions here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-warm-700' : 'border-warm-100'}`}>
                  <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Order ID</th>
                  <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Date</th>
                  <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Amount</th>
                  <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-warm-800' : 'divide-warm-50'}`}>
                {recentSales.map((s) => (
                  <tr
                    key={s.id}
                    className={`cursor-pointer transition-colors ${darkMode ? 'hover:bg-warm-800' : 'hover:bg-coral-50'}`}
                    onClick={() => navigate(`/vendeur/sales/${s.id}`)}
                  >
                    <td className="py-4 px-4">
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-warm-900'}`}>#{s.id}</span>
                    </td>
                    <td className={`py-4 px-4 ${darkMode ? 'text-warm-300' : 'text-warm-600'}`}>
                      {new Date(s.saleDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-teal-500">${s.totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${s.status === "CONFIRMED" || s.status === "COMPLETED"
                          ? "bg-teal-500/20 text-teal-500"
                          : s.status === "PENDING"
                            ? "bg-hof-500/20 text-hof-500"
                            : "bg-coral-500/20 text-coral-500"
                        }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, icon: Icon, color, trend, trendUp, darkMode }) {
  const colorClasses = {
    coral: 'from-coral-500 to-coral-600',
    teal: 'from-teal-500 to-teal-600',
    arches: 'from-arches-500 to-arches-600',
    hof: 'from-hof-400 to-hof-500',
  };

  return (
    <div className={`rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'
      }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${trendUp
              ? darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-600'
              : darkMode ? 'bg-coral-500/20 text-coral-400' : 'bg-coral-50 text-coral-600'
            }`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className={`text-sm mb-1 ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>{title}</p>
      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{value}</p>
    </div>
  );
}
