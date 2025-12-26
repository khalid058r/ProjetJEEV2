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

const StatsCard = ({ title, value, icon: Icon, color = "blue", trend, trendValue }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    yellow: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  return (
    <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
      <div className="relative flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
              {trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{trendValue}</span>
              <span className="text-gray-400 font-normal">vs last period</span>
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

const PerformerCard = ({ title, data, icon: Icon, gradient = "from-indigo-600 to-purple-600" }) => (
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

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
    <div className="mb-4">
      <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
      {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function Dashboard() {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Real-time insights  Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => loadDashboard(true)} disabled={refreshing} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm font-medium text-gray-700 cursor-pointer">
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
              <option value="YEAR">This Year</option>
              <option value="ALL">All Time</option>
            </select>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            <div className="flex-1">
              <p className="font-medium text-amber-800">You have {alerts.length} unread alerts</p>
              <p className="text-sm text-amber-600">Check your notifications for important updates</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Total Revenue" value={`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} color="blue" trend={revenueTrend ? (parseFloat(revenueTrend) >= 0 ? "up" : "down") : null} trendValue={revenueTrend ? `${Math.abs(parseFloat(revenueTrend))}%` : null} />
          <StatsCard title="Total Sales" value={totalSales.toLocaleString()} icon={ShoppingCart} color="green" trend={salesTrend ? (parseFloat(salesTrend) >= 0 ? "up" : "down") : null} trendValue={salesTrend ? `${Math.abs(parseFloat(salesTrend))}%` : null} />
          <StatsCard title="Avg Order Value" value={`$${avgOrder.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Target} color="purple" />
          <StatsCard title="Low Stock Items" value={lowStock} icon={AlertTriangle} color={lowStock > 5 ? "red" : "yellow"} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatsCard title="Total Products" value={totalProducts.toLocaleString()} icon={Package} color="indigo" />
          <StatsCard title="Categories" value={totalCategories.toLocaleString()} icon={Tag} color="cyan" />
          <StatsCard title="Active Users" value={totalUsers.toLocaleString()} icon={Users} color="purple" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PerformerCard title="Top Product" data={topProduct} icon={Award} gradient="from-indigo-600 via-purple-600 to-pink-500" />
          <PerformerCard title="Best Seller" data={bestSeller} icon={User} gradient="from-emerald-500 via-teal-500 to-cyan-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Revenue Trend" subtitle="Daily revenue over selected period">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredSales.map(s => ({ date: new Date(s.saleDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }), revenue: s.totalAmount || 0 }))}>
                <defs><linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} formatter={(value) => [`$${value.toFixed(2)}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Category Distribution" subtitle="Revenue breakdown by category">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={2} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} formatter={(value) => [`$${value.toFixed(2)}`, "Revenue"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">No category data available</div>
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Top 5 Products" subtitle="Best performing products by quantity sold">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsList} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 5 Sellers" subtitle="Best performing sales representatives">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSellersList} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} name="Sales Count" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Revenue Insights" subtitle="Daily revenue trend, stability score & best/worst days">
          {dailyArr.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={movingAvg}>
                  <defs>
                    <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} formatter={(value) => [`$${value.toFixed(2)}`]} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#dailyGradient)" name="Daily Revenue" />
                  <Area type="monotone" dataKey="avg" stroke="#8b5cf6" strokeWidth={2} fill="url(#avgGradient)" name="7-day Avg" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Best Day</p>
                  <p className="text-xl font-bold text-gray-900">{bestDay?.date}</p>
                  <p className="text-blue-700 font-semibold text-lg">${bestDay?.revenue?.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                  <p className="text-sm text-red-600 font-medium">Worst Day</p>
                  <p className="text-xl font-bold text-gray-900">{worstDay?.date}</p>
                  <p className="text-red-700 font-semibold text-lg">${worstDay?.revenue?.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium">Stability Score</p>
                  <p className="text-3xl font-extrabold text-purple-700">{stability.toFixed(0)}%</p>
                  <p className="text-gray-600 text-sm">{stability > 70 ? "Stable Revenue" : stability > 40 ? "Moderate Variability" : "High Volatility"}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">No sales data available for analysis</div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
