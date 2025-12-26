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


export default function VendeurDashboard() {
  const navigate = useNavigate();

  const [kpi, setKpi] = useState(null);
  const [bestProducts, setBestProducts] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
          <ShoppingCart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  // Calculate trends (mock data for now - can be enhanced with real comparison)
  const todayRevenue = salesByDay.length > 0 ? salesByDay[salesByDay.length - 1]?.revenue || 0 : 0;
  const yesterdayRevenue = salesByDay.length > 1 ? salesByDay[salesByDay.length - 2]?.revenue || 0 : 0;
  const revenueTrend = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : 0;

  // Stats cards data
  const statsCards = [
    {
      title: "Total Revenue",
      value: `$${kpi.sales.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
      trend: revenueTrend,
      trendUp: revenueTrend >= 0,
    },
    {
      title: "Total Sales",
      value: kpi.sales.salesCount,
      icon: ShoppingCart,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Average Basket",
      value: `$${kpi.sales.averageBasket.toFixed(2)}`,
      icon: Target,
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
      trend: "+5.2%",
      trendUp: true,
    },
    {
      title: "Products Sold",
      value: kpi.products?.totalProducts || bestProducts.reduce((acc, p) => acc + (p.quantitySold || 0), 0),
      icon: Package,
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-50 to-red-50",
      trend: "+8%",
      trendUp: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 lg:p-8">

      {/* ================= HEADER ================= */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Seller Dashboard
          </h1>
        </div>
        <p className="text-gray-500 ml-14">
          Track your sales performance and grow your business
        </p>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className={`relative overflow-hidden bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
          >
            {/* Background decoration */}
            <div className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br ${card.gradient} rounded-full opacity-10 blur-xl`}></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${card.gradient} rounded-xl shadow-lg`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                {card.trend && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {card.trendUp ? '↑' : '↓'} {card.trend}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ================= CHARTS ROW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Revenue Trend</h2>
              <p className="text-sm text-gray-500">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Weekly View</span>
            </div>
          </div>

          {salesByDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
              <p>No sales data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en', { weekday: 'short' })}
                />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Best Products */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900">Top Products</h2>
          </div>

          {bestProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Package className="w-12 h-12 mb-3 opacity-50" />
              <p>No products data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bestProducts.slice(0, 5).map((p, idx) => (
                <div
                  key={p.productId}
                  className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-white transition-colors cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-50 text-blue-600'
                    }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.productName}</p>
                    <p className="text-xs text-gray-500">{p.quantitySold || 0} sold</p>
                  </div>
                  <p className="font-bold text-emerald-600">${p.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= RECENT SALES ================= */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Recent Sales</h2>
          </div>
          <button
            onClick={() => navigate("/vendeur/sales")}
            className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No recent sales</p>
            <p className="text-sm">Start selling to see your transactions here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSales.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-white cursor-pointer transition-colors"
                    onClick={() => navigate(`/vendeur/sales/${s.id}`)}
                  >
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">#{s.id}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(s.saleDate).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-emerald-600">${s.totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${s.status === "CONFIRMED" || s.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : s.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
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
