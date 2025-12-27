import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Award,
  User,
  Package,
  Tag,
  Users,
  RefreshCw,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target,
} from "lucide-react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { analyticsApi, alertsApi } from "../api";
import { getSales } from "../services/salesService";
import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { getUsers } from "../services/userService";
import { useDarkMode } from "../context/DarkModeContext";

const StatsCard = ({ title, value, icon: Icon, color = "coral", trend, trendValue, isDark }) => {
  const colorClasses = {
    coral: isDark ? "bg-coral-900/30 text-coral-400" : "bg-coral-50 text-coral-600",
    teal: isDark ? "bg-teal-900/30 text-teal-400" : "bg-teal-50 text-teal-600",
    arches: isDark ? "bg-orange-900/30 text-arches-400" : "bg-orange-50 text-arches-500",
    hof: isDark ? "bg-amber-900/30 text-hof-400" : "bg-amber-50 text-hof-500",
    foggy: isDark ? "bg-warm-800/30 text-warm-400" : "bg-warm-100 text-warm-600",
    blue: isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600",
    green: isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    purple: isDark ? "bg-purple-900/30 text-purple-400" : "bg-purple-50 text-purple-600",
    red: isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600",
  };

  return (
    <div className={`relative overflow-hidden p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border group ${isDark ? "bg-warm-800 border-warm-700" : "bg-white border-warm-100"}`}>
      <div className="relative flex justify-between items-start">
        <div className="space-y-2">
          <p className={`text-sm font-medium uppercase tracking-wider ${isDark ? "text-warm-400" : "text-warm-500"}`}>{title}</p>
          <p className={`text-3xl font-bold tracking-tight ${isDark ? "text-warm-100" : "text-warm-900"}`}>{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend === "up" ? "text-teal-600" : "text-coral-500"}`}>
              {trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{trendValue}</span>
              <span className="text-warm-400 font-normal">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${colorClasses[color]} shadow-inner`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const PerformerCard = ({ title, data, icon: Icon, gradient = "from-coral-500 to-coral-600" }) => (
  <div className={`bg-gradient-to-br ${gradient} text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-semibold tracking-wide">{title}</h3>
    </div>
    {data ? (
      <>
        <p className="text-3xl font-bold truncate">{data.name}</p>
        <p className="opacity-90 text-sm mt-1">{data.value} sales</p>
      </>
    ) : (
      <p className="opacity-70 italic">No data available</p>
    )}
  </div>
);

const ChartCard = ({ title, subtitle, children, isDark }) => (
  <div className={`p-6 rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300 ${isDark ? "bg-warm-800 border-warm-700" : "bg-white border-warm-100"}`}>
    <div className="mb-4">
      <h3 className={`font-semibold text-lg ${isDark ? "text-warm-100" : "text-warm-900"}`}>{title}</h3>
      {subtitle && <p className="text-warm-500 text-sm mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const COLORS = ["#FF5A5F", "#00A699", "#FC642D", "#FFB400", "#767676", "#484848", "#EC4899", "#06B6D4"];

export default function Dashboard() {
  const { darkMode } = useDarkMode();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [period, setPeriod] = useState("MONTH");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => loadDashboard(true), 120000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [salesRes, productsRes, categoriesRes, usersRes, alertsRes] = await Promise.all([
        getSales(),
        getProducts(),
        getCategories(),
        getUsers(),
        alertsApi.getUnread().catch(() => ({ data: [] })),
      ]);

      setSales(Array.isArray(salesRes?.data) ? salesRes.data : []);
      setProducts(Array.isArray(productsRes?.data) ? productsRes.data : []);
      setCategories(Array.isArray(categoriesRes?.data) ? categoriesRes.data : []);
      setUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
      setAlerts(Array.isArray(alertsRes?.data) ? alertsRes.data : []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Dashboard loading error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-warm-900" : "bg-gradient-to-br from-warm-50 to-warm-100"}`}>
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-coral-200 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className={`font-medium ${darkMode ? "text-warm-300" : "text-warm-600"}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const filteredSales = sales.filter((s) => {
    const d = new Date(s.saleDate);
    if (period === "MONTH") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "YEAR") return d.getFullYear() === now.getFullYear();
    if (period === "WEEK") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    return true;
  });

  const totalRevenue = filteredSales.reduce((sum, v) => sum + (v.totalAmount || 0), 0);
  const totalSales = filteredSales.length;
  const avgOrder = totalSales ? totalRevenue / totalSales : 0;
  const lowStock = products.filter((p) => p.stock < 5).length;
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const totalUsers = users.length;

  const previousPeriodSales = sales.filter((s) => {
    const d = new Date(s.saleDate);
    if (period === "MONTH") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return d >= lastMonth && d < thisMonth;
    }
    return false;
  });

  const previousRevenue = previousPeriodSales.reduce((sum, v) => sum + (v.totalAmount || 0), 0);
  const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : null;
  const salesTrend = previousPeriodSales.length > 0 ? ((totalSales - previousPeriodSales.length) / previousPeriodSales.length * 100).toFixed(1) : null;

  const productCounter = {};
  filteredSales.forEach((s) => s.lignes?.forEach((l) => {
    productCounter[l.productTitle] = (productCounter[l.productTitle] || 0) + l.quantity;
  }));

  const topProduct = Object.entries(productCounter).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)[0];
  const topProductsList = Object.entries(productCounter).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  const sellerCounter = {};
  filteredSales.forEach((s) => { sellerCounter[s.username] = (sellerCounter[s.username] || 0) + 1; });

  const bestSeller = Object.entries(sellerCounter).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)[0];
  const topSellersList = Object.entries(sellerCounter).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  const catMap = {};
  filteredSales.forEach((s) => s.lignes?.forEach((l) => {
    const p = products.find((x) => x.id === l.productId);
    const c = categories.find((x) => x.id === p?.categoryId);
    if (c) catMap[c.name] = (catMap[c.name] || 0) + l.quantity * l.unitPrice;
  }));

  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  const daily = {};
  sales.forEach((s) => {
    const d = s.saleDate?.split("T")[0];
    if (d) daily[d] = (daily[d] || 0) + (s.totalAmount || 0);
  });

  const dailyArr = Object.entries(daily).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => new Date(a.date) - new Date(b.date));
  const movingAvg = dailyArr.map((item, i) => {
    const window = dailyArr.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((s, v) => s + v.revenue, 0) / window.length;
    return { ...item, avg };
  });

  const values = dailyArr.map((d) => d.revenue);
  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const variance = values.length > 0 ? values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length : 0;
  const stability = mean > 0 ? Math.max(0, 100 - (Math.sqrt(variance) / mean) * 100) : 0;

  const bestDay = dailyArr.length > 0 ? dailyArr.reduce((a, b) => (a.revenue > b.revenue ? a : b), dailyArr[0]) : null;
  const worstDay = dailyArr.length > 0 ? dailyArr.reduce((a, b) => (a.revenue < b.revenue ? a : b), dailyArr[0]) : null;

  return (
    <div className={`min-h-screen ${darkMode ? "bg-warm-900" : "bg-gradient-to-br from-warm-50 via-white to-warm-100"}`}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r ${darkMode ? "from-warm-100 via-coral-400 to-coral-300" : "from-warm-900 via-coral-600 to-coral-500"} bg-clip-text text-transparent`}>
              Dashboard Overview
            </h1>
            <p className={`text-sm mt-1 flex items-center gap-2 ${darkMode ? "text-warm-400" : "text-warm-500"}`}>
              <Activity className="w-4 h-4" />
              Real-time insights  Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => loadDashboard(true)} disabled={refreshing} className={`p-2.5 border rounded-xl transition-all shadow-sm disabled:opacity-50 ${darkMode ? "bg-warm-800 border-warm-700 hover:bg-warm-700" : "bg-white border-warm-200 hover:bg-warm-50"}`}>
              <RefreshCw className={`w-5 h-5 ${darkMode ? "text-warm-300" : "text-warm-600"} ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className={`border rounded-xl px-4 py-2.5 shadow-sm font-medium cursor-pointer focus:ring-2 focus:ring-coral-500 focus:border-transparent ${darkMode ? "bg-warm-800 border-warm-700 text-warm-200" : "bg-white border-warm-200 text-warm-700"}`}>
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
              <option value="YEAR">This Year</option>
              <option value="ALL">All Time</option>
            </select>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${darkMode ? "bg-hof-900/30 border border-hof-700" : "bg-gradient-to-r from-hof-50 to-orange-50 border border-hof-200"}`}>
            <div className={`p-2 rounded-lg ${darkMode ? "bg-hof-800" : "bg-hof-100"}`}><AlertTriangle className={`w-5 h-5 ${darkMode ? "text-hof-400" : "text-hof-600"}`} /></div>
            <div className="flex-1">
              <p className={`font-medium ${darkMode ? "text-hof-300" : "text-hof-800"}`}>You have {alerts.length} unread alerts</p>
              <p className={`text-sm ${darkMode ? "text-hof-400" : "text-hof-600"}`}>Check your notifications for important updates</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard isDark={darkMode} title="Total Revenue" value={`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} color="coral" trend={revenueTrend ? (parseFloat(revenueTrend) >= 0 ? "up" : "down") : null} trendValue={revenueTrend ? `${Math.abs(parseFloat(revenueTrend))}%` : null} />
          <StatsCard isDark={darkMode} title="Total Sales" value={totalSales.toLocaleString()} icon={ShoppingCart} color="teal" trend={salesTrend ? (parseFloat(salesTrend) >= 0 ? "up" : "down") : null} trendValue={salesTrend ? `${Math.abs(parseFloat(salesTrend))}%` : null} />
          <StatsCard isDark={darkMode} title="Avg Order Value" value={`$${avgOrder.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Target} color="arches" />
          <StatsCard isDark={darkMode} title="Low Stock Items" value={lowStock} icon={AlertTriangle} color={lowStock > 5 ? "red" : "hof"} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatsCard isDark={darkMode} title="Total Products" value={totalProducts.toLocaleString()} icon={Package} color="foggy" />
          <StatsCard isDark={darkMode} title="Categories" value={totalCategories.toLocaleString()} icon={Tag} color="teal" />
          <StatsCard isDark={darkMode} title="Active Users" value={totalUsers.toLocaleString()} icon={Users} color="coral" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PerformerCard title="Top Product" data={topProduct} icon={Award} gradient="from-coral-500 via-coral-600 to-arches-500" />
          <PerformerCard title="Best Seller" data={bestSeller} icon={User} gradient="from-teal-500 via-teal-600 to-teal-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard isDark={darkMode} title="Revenue Trend" subtitle="Daily revenue over selected period">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredSales.map(s => ({ date: new Date(s.saleDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }), revenue: s.totalAmount || 0 }))}>
                <defs><linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.3} /><stop offset="95%" stopColor="#FF5A5F" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#f0f0f0"} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#6b7280" }} stroke={darkMode ? "#4b5563" : "#9ca3af"} />
                <YAxis tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#6b7280" }} stroke={darkMode ? "#4b5563" : "#9ca3af"} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#f3f4f6" : "#111827" }} formatter={(value) => [`$${value.toFixed(2)}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#FF5A5F" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard isDark={darkMode} title="Category Distribution" subtitle="Revenue breakdown by category">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={2} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#f3f4f6" : "#111827" }} formatter={(value) => [`$${value.toFixed(2)}`, "Revenue"]} />
                  <Legend wrapperStyle={{ color: darkMode ? "#d1d5db" : "#374151" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-[300px] flex items-center justify-center ${darkMode ? "text-warm-500" : "text-gray-400"}`}>No category data available</div>
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard isDark={darkMode} title="Top 5 Products" subtitle="Best performing products by quantity sold">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsList} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#f0f0f0"} />
                <XAxis type="number" tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#6b7280" }} stroke={darkMode ? "#4b5563" : "#9ca3af"} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: darkMode ? "#9ca3af" : "#6b7280" }} stroke={darkMode ? "#4b5563" : "#9ca3af"} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#f3f4f6" : "#111827" }} />
                <Bar dataKey="value" fill="#FF5A5F" radius={[0, 6, 6, 0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard isDark={darkMode} title="Top 5 Sellers" subtitle="Best performing sales representatives">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSellersList} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#f0f0f0"} />
                <XAxis type="number" tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#6b7280" }} stroke={darkMode ? "#4b5563" : "#9ca3af"} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: darkMode ? "#9ca3af" : "#6b7280" }} stroke={darkMode ? "#4b5563" : "#9ca3af"} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#f3f4f6" : "#111827" }} />
                <Bar dataKey="value" fill="#00A699" radius={[0, 6, 6, 0]} name="Sales Count" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard isDark={darkMode} title="Revenue Insights" subtitle="Daily revenue trend, stability score & best/worst days">
          {dailyArr.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={movingAvg}>
                  <defs>
                    <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.3} /><stop offset="95%" stopColor="#FF5A5F" stopOpacity={0} /></linearGradient>
                    <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00A699" stopOpacity={0.3} /><stop offset="95%" stopColor="#00A699" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#f0f0f0"} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#6b7280" }} stroke={darkMode ? "#4b5563" : "#9ca3af"} />
                  <YAxis tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#6b7280" }} stroke={darkMode ? "#4b5563" : "#9ca3af"} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#f3f4f6" : "#111827" }} formatter={(value) => [`$${value.toFixed(2)}`]} />
                  <Legend wrapperStyle={{ color: darkMode ? "#d1d5db" : "#374151" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#FF5A5F" strokeWidth={2} fill="url(#dailyGradient)" name="Daily Revenue" />
                  <Area type="monotone" dataKey="avg" stroke="#00A699" strokeWidth={2} fill="url(#avgGradient)" name="7-day Avg" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className={`p-4 rounded-xl border ${darkMode ? "bg-teal-900/30 border-teal-700" : "bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200"}`}>
                  <p className={`text-sm font-medium ${darkMode ? "text-teal-400" : "text-teal-600"}`}>Best Day</p>
                  <p className={`text-xl font-bold ${darkMode ? "text-warm-100" : "text-gray-900"}`}>{bestDay?.date}</p>
                  <p className={`font-semibold text-lg ${darkMode ? "text-teal-300" : "text-teal-700"}`}>${bestDay?.revenue?.toFixed(2)}</p>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? "bg-coral-900/30 border-coral-700" : "bg-gradient-to-br from-coral-50 to-coral-100 border-coral-200"}`}>
                  <p className={`text-sm font-medium ${darkMode ? "text-coral-400" : "text-coral-600"}`}>Worst Day</p>
                  <p className={`text-xl font-bold ${darkMode ? "text-warm-100" : "text-gray-900"}`}>{worstDay?.date}</p>
                  <p className={`font-semibold text-lg ${darkMode ? "text-coral-300" : "text-coral-700"}`}>${worstDay?.revenue?.toFixed(2)}</p>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? "bg-arches-900/30 border-arches-700" : "bg-gradient-to-br from-arches-50 to-arches-100 border-arches-200"}`}>
                  <p className={`text-sm font-medium ${darkMode ? "text-arches-400" : "text-arches-600"}`}>Stability Score</p>
                  <p className={`text-3xl font-extrabold ${darkMode ? "text-arches-300" : "text-arches-700"}`}>{stability.toFixed(0)}%</p>
                  <p className={`text-sm ${darkMode ? "text-warm-400" : "text-gray-600"}`}>{stability > 70 ? "Stable Revenue" : stability > 40 ? "Moderate Variability" : "High Volatility"}</p>
                </div>
              </div>
            </>
          ) : (
            <div className={`p-8 text-center ${darkMode ? "text-warm-500" : "text-gray-500"}`}>No sales data available for analysis</div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
