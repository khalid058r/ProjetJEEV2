import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  Wallet,
  Target,
  Building2,
  LineChart,
  Download,
  LogOut,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";

import { getSales } from "../../services/salesService";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";

const COLORS = ['#FF5A5F', '#00A699', '#FC642D', '#FFB400', '#767676', '#914669'];

export default function InvestisseurHome() {
  const [darkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("month");

  const [financials, setFinancials] = useState({
    totalRevenue: 0,
    monthlyGrowth: 0,
    avgOrderValue: 0,
    profitMargin: 28.5,
    totalOrders: 0,
    activeProducts: 0,
    roi: 0,
    cac: 0,
  });

  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [monthlyComparison, setMonthlyComparison] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [salesRes, productsRes, categoriesRes] = await Promise.all([
        getSales().catch(() => ({ data: [] })),
        getProducts().catch(() => ({ data: [] })),
        getCategories().catch(() => ({ data: [] })),
      ]);

      const sales = Array.isArray(salesRes?.data) ? salesRes.data : [];
      const products = Array.isArray(productsRes?.data) ? productsRes.data : [];
      const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];

      const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s?.totalAmount || 0), 0);
      const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;

      const now = new Date();
      const thisMonth = sales.filter(s => {
        const d = new Date(s?.saleDate || s?.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const lastMonth = sales.filter(s => {
        const d = new Date(s?.saleDate || s?.createdAt);
        const lm = new Date(now.getFullYear(), now.getMonth() - 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      });

      const thisMonthRev = thisMonth.reduce((sum, s) => sum + parseFloat(s?.totalAmount || 0), 0);
      const lastMonthRev = lastMonth.reduce((sum, s) => sum + parseFloat(s?.totalAmount || 0), 0);
      const monthlyGrowth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev * 100) : 0;

      const investedCapital = 50000;
      const roi = totalRevenue > 0 ? ((totalRevenue - investedCapital) / investedCapital * 100) : 0;

      setFinancials({
        totalRevenue,
        monthlyGrowth: parseFloat(monthlyGrowth.toFixed(1)),
        avgOrderValue,
        profitMargin: 28.5,
        totalOrders: sales.length,
        activeProducts: products.length,
        roi: parseFloat(roi.toFixed(1)),
        cac: 45.00,
      });

      const dailyMap = {};
      sales.forEach(sale => {
        const date = (sale?.saleDate || sale?.createdAt || '').split('T')[0];
        if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, orders: 0 };
        dailyMap[date].revenue += parseFloat(sale?.totalAmount || 0);
        dailyMap[date].orders += 1;
      });
      setRevenueTrend(Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-30));

      const catMap = {};
      categories.forEach(cat => {
        catMap[cat.id] = { name: cat.name, revenue: 0 };
      });
      sales.forEach(sale => {
        (sale?.lignes || []).forEach(ligne => {
          const prod = products.find(p => p.id === ligne?.productId);
          if (prod && catMap[prod.categoryId]) {
            catMap[prod.categoryId].revenue += parseFloat(ligne?.quantity || 1) * parseFloat(ligne?.unitPrice || 0);
          }
        });
      });
      setCategoryRevenue(Object.values(catMap).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 6));

      const monthMap = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      sales.forEach(sale => {
        const d = new Date(sale?.saleDate || sale?.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
        if (!monthMap[key]) monthMap[key] = { month: label, revenue: 0, orders: 0, sortKey: key };
        monthMap[key].revenue += parseFloat(sale?.totalAmount || 0);
        monthMap[key].orders += 1;
      });
      setMonthlyComparison(Object.values(monthMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey)).slice(-12));

      setRecentActivity(sales.sort((a, b) => new Date(b?.saleDate || b?.createdAt) - new Date(a?.saleDate || a?.createdAt)).slice(0, 5));

    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-teal-900 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-warm-400 font-medium">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-teal-500" />
              Investor Dashboard
            </h1>
            <p className="text-warm-400 mt-1">Financial overview & growth metrics</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 bg-warm-900 border border-warm-700 rounded-xl text-white text-sm"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>

            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-warm-900 border border-warm-700 rounded-xl text-warm-300 hover:bg-warm-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-coral-500/20 border border-coral-500/50 rounded-xl text-coral-400 hover:bg-coral-500/30 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FinancialCard icon={DollarSign} title="Total Revenue" value={`$${financials.totalRevenue.toFixed(2)}`} change={financials.monthlyGrowth} color="teal" />
          <FinancialCard icon={TrendingUp} title="Monthly Growth" value={`${financials.monthlyGrowth}%`} change={financials.monthlyGrowth} color="coral" />
          <FinancialCard icon={Target} title="Avg. Order Value" value={`$${financials.avgOrderValue.toFixed(2)}`} change={5.2} color="arches" />
          <FinancialCard icon={Activity} title="Profit Margin" value={`${financials.profitMargin}%`} change={2.1} color="hof" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-warm-900 border border-warm-800 rounded-2xl p-5">
            <p className="text-warm-500 text-sm">Total Orders</p>
            <p className="text-2xl font-bold text-white mt-1">{financials.totalOrders}</p>
          </div>
          <div className="bg-warm-900 border border-warm-800 rounded-2xl p-5">
            <p className="text-warm-500 text-sm">Active Products</p>
            <p className="text-2xl font-bold text-white mt-1">{financials.activeProducts}</p>
          </div>
          <div className="bg-warm-900 border border-warm-800 rounded-2xl p-5">
            <p className="text-warm-500 text-sm">ROI</p>
            <p className={`text-2xl font-bold mt-1 ${financials.roi >= 0 ? 'text-teal-400' : 'text-coral-400'}`}>{financials.roi}%</p>
          </div>
          <div className="bg-warm-900 border border-warm-800 rounded-2xl p-5">
            <p className="text-warm-500 text-sm">CAC</p>
            <p className="text-2xl font-bold text-white mt-1">${financials.cac.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-warm-900 border border-warm-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-teal-500" />
              Revenue Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="investorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00A699" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00A699" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="date" tick={{ fill: '#A3A3A3', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#A3A3A3', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#262626', border: 'none', borderRadius: '12px' }} labelStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#00A699" fill="url(#investorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-warm-900 border border-warm-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-coral-500" />
              Revenue by Category
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={categoryRevenue} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#767676' }}>
                    {categoryRevenue.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#262626', border: 'none', borderRadius: '12px' }} formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-warm-900 border border-warm-800 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-arches-500" />
              Monthly Performance
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="month" tick={{ fill: '#A3A3A3', fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#A3A3A3', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#A3A3A3', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#262626', border: 'none', borderRadius: '12px' }} labelStyle={{ color: '#fff' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#FC642D" name="Revenue ($)" radius={[6, 6, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#00A699" name="Orders" strokeWidth={2} dot={{ fill: '#00A699' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-warm-900 border border-warm-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-warm-800">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-warm-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-warm-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-warm-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-warm-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-warm-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-800">
                {recentActivity.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-warm-500">No recent transactions</td></tr>
                ) : (
                  recentActivity.map((sale, idx) => (
                    <tr key={idx} className="hover:bg-warm-800/50 transition">
                      <td className="px-6 py-4 text-warm-300">{new Date(sale?.saleDate || sale?.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-white font-mono">#{sale?.id || idx + 1}</td>
                      <td className="px-6 py-4 text-right text-teal-400 font-semibold">${parseFloat(sale?.totalAmount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${sale?.status === 'COMPLETED' ? 'bg-teal-500/20 text-teal-400' : sale?.status === 'PENDING' ? 'bg-hof-500/20 text-hof-400' : 'bg-coral-500/20 text-coral-400'}`}>
                          {sale?.status || 'COMPLETED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function FinancialCard({ icon: Icon, title, value, change, color }) {
  const colorClasses = { teal: 'from-teal-500 to-teal-600', coral: 'from-coral-500 to-coral-600', arches: 'from-arches-500 to-arches-600', hof: 'from-hof-400 to-hof-500' };
  return (
    <div className="bg-warm-900 border border-warm-800 rounded-2xl p-5 hover:border-warm-700 transition">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}><Icon className="w-5 h-5" /></div>
        {change !== null && change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${change >= 0 ? 'bg-teal-500/20 text-teal-400' : 'bg-coral-500/20 text-coral-400'}`}>
            {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-warm-400 mt-1">{title}</p>
    </div>
  );
}
