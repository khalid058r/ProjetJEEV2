import { useEffect, useState } from "react";
import {
    DollarSign,
    TrendingUp,
    ShoppingCart,
    Package,
    FolderTree,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Zap,
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
    ResponsiveContainer,
    Legend
} from "recharts";

import { getSales } from "../../services/salesService";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { useDarkMode } from "../../context/DarkModeContext";

// Airbnb Chart Colors
const AIRBNB_COLORS = ['#FF5A5F', '#00A699', '#FC642D', '#FFB400', '#767676', '#484848'];

// KPI Card Component
function KPICard({ title, value, change, icon: Icon, color, darkMode }) {
    const colorClasses = {
        coral: 'from-coral-500 to-coral-600',
        teal: 'from-teal-500 to-teal-600',
        arches: 'from-arches-500 to-arches-600',
        hof: 'from-hof-400 to-hof-500',
        foggy: 'from-warm-500 to-warm-600',
    };

    return (
        <div className={`rounded-2xl border p-5 hover:shadow-lg transition-all duration-300 ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'
            }`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color] || colorClasses.coral} text-white shadow-lg`}>
                    <Icon className="w-5 h-5" />
                </div>
                {change !== null && change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${change >= 0
                            ? darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-600'
                            : darkMode ? 'bg-coral-500/20 text-coral-400' : 'bg-coral-50 text-coral-600'
                        }`}>
                        {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{value}</div>
            <div className={`text-sm mt-1 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>{title}</div>
        </div>
    );
}

export default function AnalystDashboard() {
    const { darkMode } = useDarkMode();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [kpis, setKpis] = useState({
        totalRevenue: 0,
        totalSales: 0,
        avgBasket: 0,
        totalProducts: 0,
        totalCategories: 0,
        growthRate: 0
    });
    const [salesTrend, setSalesTrend] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [salesRes, productsRes, categoriesRes] = await Promise.all([
                getSales().catch(() => ({ data: [] })),
                getProducts().catch(() => ({ data: [] })),
                getCategories().catch(() => ({ data: [] }))
            ]);

            const sales = Array.isArray(salesRes?.data) ? salesRes.data : (Array.isArray(salesRes) ? salesRes : []);
            const products = Array.isArray(productsRes?.data) ? productsRes.data : (Array.isArray(productsRes) ? productsRes : []);
            const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : (Array.isArray(categoriesRes) ? categoriesRes : []);

            // Calculate KPIs
            const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s?.totalAmount || 0), 0);
            const totalSales = sales.length;
            const avgBasket = totalSales > 0 ? totalRevenue / totalSales : 0;

            // Growth rate calculation
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
            const growthRate = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev * 100) : 0;

            setKpis({
                totalRevenue,
                totalSales,
                avgBasket,
                totalProducts: products.length,
                totalCategories: categories.length,
                growthRate: parseFloat(growthRate.toFixed(1))
            });

            // Build sales trend (last 14 days)
            const dailyMap = {};
            sales.forEach(sale => {
                const date = (sale?.saleDate || sale?.createdAt || '').split('T')[0] || new Date().toISOString().split('T')[0];
                if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, orders: 0 };
                dailyMap[date].revenue += parseFloat(sale?.totalAmount || 0);
                dailyMap[date].orders += 1;
            });
            setSalesTrend(Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14));

            // Category stats
            const catMap = {};
            sales.forEach(sale => {
                (sale?.lignes || []).forEach(ligne => {
                    const prod = products.find(p => p.id === ligne?.productId);
                    const cat = categories.find(c => c.id === prod?.categoryId);
                    const catName = cat?.name || 'Other';
                    if (!catMap[catName]) catMap[catName] = { name: catName, value: 0 };
                    catMap[catName].value += parseFloat(ligne?.quantity || 1) * parseFloat(ligne?.unitPrice || 0);
                });
            });
            setCategoryStats(Object.values(catMap).filter(c => c.value > 0).slice(0, 6));

            // Top products
            const prodMap = {};
            sales.forEach(sale => {
                (sale?.lignes || []).forEach(ligne => {
                    const name = ligne?.productTitle || 'Unknown';
                    if (!prodMap[name]) prodMap[name] = { name, sales: 0, revenue: 0 };
                    prodMap[name].sales += parseFloat(ligne?.quantity || 1);
                    prodMap[name].revenue += parseFloat(ligne?.quantity || 1) * parseFloat(ligne?.unitPrice || 0);
                });
            });
            setTopProducts(Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-coral-50/20'}`}>
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-coral-200 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className={`font-medium ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-6 ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-coral-50/20'}`}>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                            Analytics Dashboard
                        </h1>
                        <p className={`mt-1 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
                            Real-time insights and performance metrics
                        </p>
                    </div>
                    <button
                        onClick={() => loadDashboard(true)}
                        disabled={refreshing}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${darkMode
                                ? 'bg-warm-800 text-white hover:bg-warm-700'
                                : 'bg-white text-warm-700 hover:bg-warm-50 border border-warm-200'
                            } disabled:opacity-50`}
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <KPICard
                        title="Total Revenue"
                        value={`$${kpis.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        change={kpis.growthRate}
                        icon={DollarSign}
                        color="coral"
                        darkMode={darkMode}
                    />
                    <KPICard
                        title="Total Sales"
                        value={kpis.totalSales.toLocaleString()}
                        change={null}
                        icon={ShoppingCart}
                        color="teal"
                        darkMode={darkMode}
                    />
                    <KPICard
                        title="Avg. Basket"
                        value={`$${kpis.avgBasket.toFixed(2)}`}
                        change={null}
                        icon={Activity}
                        color="arches"
                        darkMode={darkMode}
                    />
                    <KPICard
                        title="Products"
                        value={kpis.totalProducts.toLocaleString()}
                        change={null}
                        icon={Package}
                        color="hof"
                        darkMode={darkMode}
                    />
                    <KPICard
                        title="Categories"
                        value={kpis.totalCategories.toLocaleString()}
                        change={null}
                        icon={FolderTree}
                        color="foggy"
                        darkMode={darkMode}
                    />
                    <KPICard
                        title="Growth Rate"
                        value={`${kpis.growthRate > 0 ? '+' : ''}${kpis.growthRate}%`}
                        change={null}
                        icon={TrendingUp}
                        color="teal"
                        darkMode={darkMode}
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trend */}
                    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>Revenue Trend</h3>
                                <p className={`text-sm ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Last 14 days</p>
                            </div>
                            <Zap className="w-5 h-5 text-coral-500" />
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesTrend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                                    <XAxis
                                        dataKey="date"
                                        stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                                            border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                                            borderRadius: '12px'
                                        }}
                                        formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#FF5A5F"
                                        strokeWidth={3}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Distribution */}
                    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>Sales by Category</h3>
                                <p className={`text-sm ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Revenue distribution</p>
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryStats.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={AIRBNB_COLORS[index % AIRBNB_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                                            border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                                            borderRadius: '12px'
                                        }}
                                        formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>Top Products</h3>
                            <p className={`text-sm ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Best performing products by revenue</p>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                                <XAxis type="number" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={120}
                                    stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                                        border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                                        borderRadius: '12px'
                                    }}
                                    formatter={(value, name) => [name === 'revenue' ? `$${value.toFixed(2)}` : value, name]}
                                />
                                <Bar dataKey="revenue" fill="#FF5A5F" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
