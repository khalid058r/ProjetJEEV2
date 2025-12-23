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
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getSales } from "../services/salesService";
import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { getUsers } from "../services/userService";

/* =======================================================
   ⭐ UI COMPONENTS (IMPROVED)
======================================================= */

const StatsCard = ({ title, value, icon: Icon, color = "blue" }) => (
  <div className="bg-white p-6 rounded-2xl shadow-[0_3px_10px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all border border-gray-100">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
      </div>

      <div className={`p-4 rounded-xl bg-${color}-50 text-${color}-600 shadow-inner`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const PerformerCard = ({ title, data, icon: Icon }) => (
  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-5 h-5" />
      <h3 className="text-lg font-semibold tracking-wide">{title}</h3>
    </div>

    {data ? (
      <>
        <p className="text-3xl font-bold">{data.name}</p>
        <p className="opacity-90 text-sm">{data.value} sales</p>
      </>
    ) : (
      <p className="opacity-70">No data available</p>
    )}
  </div>
);

/* =======================================================
   ⭐ MAIN DASHBOARD
======================================================= */

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  const [period, setPeriod] = useState("MONTH");
  const [comparisonMode, setComparisonMode] = useState("MONTHLY");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [s, p, c, u] = await Promise.all([
        getSales(),
        getProducts(),
        getCategories(),
        getUsers(),
      ]);

      setSales(s.data || []);
      setProducts(p.data || []);
      setCategories(c.data || []);
      setUsers(u.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xl text-gray-500 animate-pulse">
        Loading dashboard...
      </div>
    );
  }

  /* =======================================================
     FILTER BY PERIOD
  ======================================================= */

  const now = new Date();
  const filteredSales = sales.filter((s) => {
    const d = new Date(s.saleDate);
    if (period === "MONTH") return d.getMonth() === now.getMonth();
    if (period === "YEAR") return d.getFullYear() === now.getFullYear();
    return true;
  });

  /* =======================================================
     KPI METRICS
  ======================================================= */

  const totalRevenue = filteredSales.reduce((sum, v) => sum + v.totalAmount, 0);
  const totalSales = filteredSales.length;
  const avgOrder = totalSales ? totalRevenue / totalSales : 0;

  const lowStock = products.filter((p) => p.stock < 5).length;
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const totalUsers = users.length;

  /* =======================================================
     TOP PRODUCTS
  ======================================================= */

  const productCounter = {};
  filteredSales.forEach((s) =>
    s.lignes?.forEach((l) => {
      productCounter[l.productTitle] =
        (productCounter[l.productTitle] || 0) + l.quantity;
    })
  );

  const topProduct = Object.entries(productCounter)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)[0];

  const topProductsList = Object.entries(productCounter)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  /* =======================================================
     TOP SELLERS
  ======================================================= */

  const sellerCounter = {};
  filteredSales.forEach((s) => {
    sellerCounter[s.username] = (sellerCounter[s.username] || 0) + 1;
  });

  const bestSeller = Object.entries(sellerCounter)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)[0];

  const topSellersList = Object.entries(sellerCounter)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  /* =======================================================
     CATEGORY DISTRIBUTION
  ======================================================= */

  const catMap = {};
  filteredSales.forEach((s) =>
    s.lignes?.forEach((l) => {
      const p = products.find((x) => x.id === l.productId);
      const c = categories.find((x) => x.id === p?.categoryId);
      if (!c) return;

      catMap[c.name] = (catMap[c.name] || 0) + l.quantity * l.unitPrice;
    })
  );

  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  /* =======================================================
     REVENUE COMPARISON
  ======================================================= */

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const weekSales = sales.filter((s) => new Date(s.saleDate) >= startOfWeek);
  const lastWeekSales = sales.filter((s) => {
    const d = new Date(s.saleDate);
    return d >= lastWeekStart && d < startOfWeek;
  });

  const weekRevenue = weekSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const lastWeekRevenue = lastWeekSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const monthSales = sales.filter((s) => new Date(s.saleDate) >= startOfMonth);
  const lastMonthSales = sales.filter((s) => {
    const d = new Date(s.saleDate);
    return d >= startLastMonth && d < startOfMonth;
  });

  const monthRevenue = monthSales.reduce((s, v) => s + v.totalAmount, 0);
  const lastMonthRevenue = lastMonthSales.reduce((s, v) => s + v.totalAmount, 0);

  /* =======================================================
     ⭐ UI RENDER (IMPROVED)
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
              Dashboard Overview
            </h1>
            <p className="text-gray-500 text-sm">
              Insights, performance, and business analytics
            </p>
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded-xl px-4 py-2 bg-white shadow-sm font-medium"
          >
            <option value="MONTH">This Month</option>
            <option value="YEAR">This Year</option>
            <option value="ALL">All Time</option>
          </select>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard title="Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} color="blue" />
          <StatsCard title="Sales" value={totalSales} icon={ShoppingCart} color="green" />
          <StatsCard title="Avg Order" value={`$${avgOrder.toFixed(2)}`} icon={TrendingUp} color="purple" />
          <StatsCard title="Low Stock" value={lowStock} icon={AlertTriangle} color="red" />
        </div>

        {/* ADMIN KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard title="Total Products" value={totalProducts} icon={Package} color="purple" />
          <StatsCard title="Total Categories" value={totalCategories} icon={Tag} color="yellow" />
          <StatsCard title="Total Users" value={totalUsers} icon={Users} color="indigo" />
        </div>

        {/* TOP PRODUCT & SELLER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PerformerCard title="Top Product" data={topProduct} icon={Award} />
          <PerformerCard title="Best Seller" data={bestSeller} icon={User} />
        </div>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* REVENUE TREND */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-lg transition">
            <h3 className="font-semibold mb-4 text-lg">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredSales.map(s => ({
                date: s.saleDate,
                revenue: s.totalAmount,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#c7d2fe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* CATEGORY DISTRIBUTION */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-lg transition">
            <h3 className="font-semibold mb-4 text-lg">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"][i % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* TOP LIST CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* TOP PRODUCTS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-lg transition">
            <h3 className="font-semibold mb-4 text-lg">Top 5 Products</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsList}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* TOP SELLERS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-lg transition">
            <h3 className="font-semibold mb-4 text-lg">Top 5 Sellers</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSellersList}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* =========================
            REVENUE INSIGHTS PANEL
        ========================== */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-lg transition">

          <h3 className="font-semibold text-xl mb-1">Revenue Insights</h3>
          <p className="text-gray-500 text-sm mb-6">
            Daily revenue trend, stability score & best/worst days
          </p>

          {/* DATA PROCESSING */}
          {(() => {
            const daily = {};

            sales.forEach((s) => {
              const d = s.saleDate.split("T")[0];
              daily[d] = (daily[d] || 0) + s.totalAmount;
            });

            const dailyArr = Object.entries(daily).map(([date, revenue]) => ({
              date,
              revenue,
            }));

            dailyArr.sort((a, b) => new Date(a.date) - new Date(b.date));

            // MOVING AVERAGE
            const movingAvg = dailyArr.map((item, i) => {
              const window = dailyArr.slice(Math.max(0, i - 6), i + 1);
              const avg = window.reduce((s, v) => s + v.revenue, 0) / window.length;
              return { ...item, avg };
            });

            const values = dailyArr.map((d) => d.revenue);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            const stability = Math.max(0, 100 - (stdDev / mean) * 100);

            const bestDay = dailyArr.reduce((a, b) => (a.revenue > b.revenue ? a : b));
            const worstDay = dailyArr.reduce((a, b) => (a.revenue < b.revenue ? a : b));

            return (
              <>
                {/* CHART */}
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={movingAvg}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      fill="#bfdbfe"
                      name="Daily Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="avg"
                      stroke="#8b5cf6"
                      fill="#ddd6fe"
                      name="7-day Avg"
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">

                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-gray-500">Best Day</p>
                    <p className="text-xl font-bold">{bestDay.date}</p>
                    <p className="text-blue-700 font-semibold">${bestDay.revenue.toFixed(2)}</p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-sm text-gray-500">Worst Day</p>
                    <p className="text-xl font-bold">{worstDay.date}</p>
                    <p className="text-red-700 font-semibold">${worstDay.revenue.toFixed(2)}</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-sm text-gray-500">Stability Score</p>
                    <p className="text-3xl font-extrabold text-purple-700">
                      {stability.toFixed(0)}%
                    </p>
                    <p className="text-gray-600 text-sm">
                      {stability > 70
                        ? "Stable Revenue"
                        : stability > 40
                        ? "Moderate Variability"
                        : "High Volatility"}
                    </p>
                  </div>

                </div>
              </>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
