import { useState, useEffect } from "react";
import {
    DollarSign, TrendingUp, TrendingDown, ShoppingCart, Package,
    Target, Award, Users, Calendar, PieChart, BarChart2, Activity,
    ArrowUpRight, ArrowDownRight, Zap, RefreshCw, Download, Filter
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RePieChart,
    Pie, Cell, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Radar
} from "recharts";
import { getProducts } from "../../services/productService";
import { getSales } from "../../services/salesService";
import { getCategories } from "../../services/categoryService";

const COLORS = ["#FF5A5F", "#00A699", "#FC642D", "#FFB400", "#8B5CF6", "#EC4899", "#06B6D4", "#10B981"];

export default function InvestorFinancialAnalysis() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState("month");
    const [data, setData] = useState(null);

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [productsRes, salesRes, categoriesRes] = await Promise.all([
                getProducts().catch(() => ({ data: [] })),
                getSales().catch(() => ({ data: [] })),
                getCategories().catch(() => ({ data: [] }))
            ]);

            const products = Array.isArray(productsRes?.data) ? productsRes.data : [];
            const sales = Array.isArray(salesRes?.data) ? salesRes.data : [];
            const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];

            // Filter by period
            const now = new Date();
            const filteredSales = sales.filter(s => {
                const saleDate = new Date(s.saleDate);
                if (period === "week") {
                    return saleDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                } else if (period === "month") {
                    return saleDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                } else if (period === "quarter") {
                    return saleDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                } else if (period === "year") {
                    return saleDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                }
                return true;
            });

            // === FINANCIAL KPIs ===
            const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
            const totalOrders = filteredSales.length;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Gross margin (simulated: 30-45%)
            const grossMarginPercent = 32 + Math.random() * 10;
            const grossProfit = totalRevenue * (grossMarginPercent / 100);

            // Operating costs (simulated)
            const operatingCosts = totalRevenue * 0.15;
            const netProfit = grossProfit - operatingCosts;
            const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

            // Revenue per product/category
            const revenuePerProduct = products.length > 0 ? totalRevenue / products.length : 0;
            const revenuePerCategory = categories.length > 0 ? totalRevenue / categories.length : 0;

            // === GROWTH METRICS ===
            const previousPeriodSales = sales.filter(s => {
                const saleDate = new Date(s.saleDate);
                const periodDays = period === "week" ? 7 : period === "month" ? 30 : period === "quarter" ? 90 : 365;
                const start = new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000);
                const end = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
                return saleDate >= start && saleDate < end;
            });

            const previousRevenue = previousPeriodSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
            const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;
            const orderGrowth = previousPeriodSales.length > 0
                ? ((totalOrders - previousPeriodSales.length) / previousPeriodSales.length * 100)
                : 0;

            // === DAILY REVENUE TREND ===
            const dailyData = {};
            filteredSales.forEach(sale => {
                const date = sale.saleDate?.split("T")[0] || new Date().toISOString().split("T")[0];
                if (!dailyData[date]) {
                    dailyData[date] = { date, revenue: 0, orders: 0, profit: 0 };
                }
                dailyData[date].revenue += sale.totalAmount || 0;
                dailyData[date].orders += 1;
                dailyData[date].profit += (sale.totalAmount || 0) * (grossMarginPercent / 100);
            });

            const dailyTrend = Object.values(dailyData)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            // Add moving average
            const dailyWithAvg = dailyTrend.map((day, i) => {
                const window = dailyTrend.slice(Math.max(0, i - 6), i + 1);
                const avg = window.reduce((sum, d) => sum + d.revenue, 0) / window.length;
                return { ...day, movingAvg: avg };
            });

            // === CATEGORY PERFORMANCE ===
            const categoryPerformance = categories.map(cat => {
                const catProducts = products.filter(p => p.categoryId === cat.id);
                const catSales = filteredSales.flatMap(s =>
                    (s.lignes || []).filter(l => {
                        const prod = products.find(p => p.id === l.productId);
                        return prod?.categoryId === cat.id;
                    })
                );

                const revenue = catSales.reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);
                const quantity = catSales.reduce((sum, l) => sum + (l.quantity || 0), 0);
                const profit = revenue * (grossMarginPercent / 100);

                return {
                    name: cat.name,
                    revenue,
                    quantity,
                    profit,
                    productCount: catProducts.length,
                    profitMargin: revenue > 0 ? (profit / revenue * 100) : 0
                };
            }).sort((a, b) => b.revenue - a.revenue);

            // === TOP PRODUCTS ===
            const productPerformance = products.map(prod => {
                const prodSales = filteredSales.flatMap(s =>
                    (s.lignes || []).filter(l => l.productId === prod.id)
                );

                const revenue = prodSales.reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);
                const quantity = prodSales.reduce((sum, l) => sum + (l.quantity || 0), 0);
                const category = categories.find(c => c.id === prod.categoryId);

                return {
                    id: prod.id,
                    name: prod.title,
                    category: category?.name || "N/A",
                    revenue,
                    quantity,
                    price: prod.price || 0,
                    profit: revenue * (grossMarginPercent / 100),
                    roi: prod.price > 0 ? ((revenue - (quantity * prod.price * 0.6)) / (quantity * prod.price * 0.6) * 100) : 0
                };
            }).sort((a, b) => b.revenue - a.revenue);

            // === MONTHLY COMPARISON ===
            const monthlyData = [];
            for (let i = 5; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

                const monthSales = sales.filter(s => {
                    const d = new Date(s.saleDate);
                    return d >= monthStart && d <= monthEnd;
                });

                const revenue = monthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
                const profit = revenue * (grossMarginPercent / 100);
                const costs = revenue * 0.15;

                monthlyData.push({
                    month: monthStart.toLocaleDateString("fr", { month: "short" }),
                    revenue,
                    profit,
                    costs,
                    orders: monthSales.length
                });
            }

            // === RADAR CHART DATA (Business Health) ===
            const maxRevenue = Math.max(...categoryPerformance.map(c => c.revenue), 1);
            const radarData = [
                { metric: "Revenus", value: Math.min(100, (totalRevenue / 10000) * 100) },
                { metric: "Croissance", value: Math.min(100, Math.max(0, revenueGrowth + 50)) },
                { metric: "Marge", value: grossMarginPercent * 2 },
                { metric: "Volume", value: Math.min(100, totalOrders * 2) },
                { metric: "Diversité", value: Math.min(100, products.length * 5) },
                { metric: "Efficacité", value: Math.min(100, netMarginPercent * 5) }
            ];

            // === PROFITABILITY BREAKDOWN ===
            const profitabilityData = [
                { name: "Revenus Bruts", value: totalRevenue },
                { name: "Coût des Marchandises", value: totalRevenue * (1 - grossMarginPercent / 100) },
                { name: "Marge Brute", value: grossProfit },
                { name: "Coûts Opérationnels", value: operatingCosts },
                { name: "Bénéfice Net", value: netProfit }
            ];

            setData({
                kpis: {
                    totalRevenue,
                    totalOrders,
                    avgOrderValue,
                    grossProfit,
                    grossMarginPercent: parseFloat(grossMarginPercent.toFixed(1)),
                    netProfit,
                    netMarginPercent: parseFloat(netMarginPercent.toFixed(1)),
                    revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
                    orderGrowth: parseFloat(orderGrowth.toFixed(1)),
                    revenuePerProduct,
                    revenuePerCategory,
                    productCount: products.length,
                    categoryCount: categories.length
                },
                dailyTrend: dailyWithAvg,
                categoryPerformance,
                topProducts: productPerformance.slice(0, 10),
                monthlyData,
                radarData,
                profitabilityData
            });

        } catch (error) {
            console.error("Error loading financial data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="min-h-screen bg-warm-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-amber-500/30 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-warm-400 font-medium">Chargement de l'analyse financière...</p>
                </div>
            </div>
        );
    }

    const KPICard = ({ title, value, subtitle, icon: Icon, color, trend, trendLabel }) => (
        <div className={`bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Icon className="w-5 h-5 text-white" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? "text-teal-300" : "text-coral-300"}`}>
                        {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-white/70 text-sm mt-1">{title}</p>
            {subtitle && <p className="text-white/50 text-xs mt-1">{subtitle}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-warm-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-amber-500" />
                            Analyse Financière
                        </h1>
                        <p className="text-warm-400 mt-1">
                            Performance financière et rentabilité
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => loadData(true)}
                            disabled={refreshing}
                            className="p-2.5 bg-warm-800 hover:bg-warm-700 border border-warm-700 rounded-xl transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 text-warm-300 ${refreshing ? "animate-spin" : ""}`} />
                        </button>

                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-4 py-2.5 bg-warm-800 border border-warm-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="week">7 jours</option>
                            <option value="month">30 jours</option>
                            <option value="quarter">90 jours</option>
                            <option value="year">1 an</option>
                        </select>
                    </div>
                </div>

                {/* Main KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Chiffre d'Affaires"
                        value={`$${data.kpis.totalRevenue.toLocaleString()}`}
                        icon={DollarSign}
                        color="from-amber-500/30 to-amber-600/20"
                        trend={data.kpis.revenueGrowth}
                    />
                    <KPICard
                        title="Bénéfice Brut"
                        value={`$${data.kpis.grossProfit.toLocaleString()}`}
                        subtitle={`Marge: ${data.kpis.grossMarginPercent}%`}
                        icon={TrendingUp}
                        color="from-teal-500/30 to-teal-600/20"
                    />
                    <KPICard
                        title="Bénéfice Net"
                        value={`$${data.kpis.netProfit.toLocaleString()}`}
                        subtitle={`Marge nette: ${data.kpis.netMarginPercent}%`}
                        icon={Target}
                        color="from-purple-500/30 to-purple-600/20"
                    />
                    <KPICard
                        title="Panier Moyen"
                        value={`$${data.kpis.avgOrderValue.toFixed(2)}`}
                        subtitle={`${data.kpis.totalOrders} commandes`}
                        icon={ShoppingCart}
                        color="from-coral-500/30 to-coral-600/20"
                        trend={data.kpis.orderGrowth}
                    />
                </div>

                {/* Revenue & Profit Trend */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Tendance Revenus & Profits</h3>
                                <p className="text-warm-400 text-sm">Évolution journalière avec moyenne mobile</p>
                            </div>
                            <Activity className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data.dailyTrend}>
                                    <defs>
                                        <linearGradient id="revenueGradFin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="profitGradFin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        tick={{ fontSize: 10 }}
                                        tickFormatter={(v) => new Date(v).toLocaleDateString("fr", { day: "numeric", month: "short" })}
                                    />
                                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "12px" }}
                                        formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" stroke="#F59E0B" fill="url(#revenueGradFin)" name="Revenus" />
                                    <Area type="monotone" dataKey="profit" stroke="#10B981" fill="url(#profitGradFin)" name="Profit" />
                                    <Line type="monotone" dataKey="movingAvg" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Moy. Mobile 7j" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Business Health Radar */}
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Santé Business</h3>
                                <p className="text-warm-400 text-sm">Score global</p>
                            </div>
                            <Zap className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={data.radarData}>
                                    <PolarGrid stroke="#374151" />
                                    <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#374151" tick={{ fontSize: 10 }} />
                                    <Radar name="Score" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Monthly Comparison & Category Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly */}
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Évolution Mensuelle</h3>
                                <p className="text-warm-400 text-sm">Revenus, Profits & Coûts</p>
                            </div>
                            <Calendar className="w-5 h-5 text-teal-500" />
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "12px" }}
                                        formatter={(value) => [`$${value.toLocaleString()}`]}
                                    />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Revenus" />
                                    <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} name="Profit" />
                                    <Bar dataKey="costs" fill="#EF4444" radius={[4, 4, 0, 0]} name="Coûts" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Revenue Distribution */}
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Revenus par Catégorie</h3>
                                <p className="text-warm-400 text-sm">Distribution du chiffre d'affaires</p>
                            </div>
                            <PieChart className="w-5 h-5 text-coral-500" />
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={data.categoryPerformance.filter(c => c.revenue > 0).slice(0, 6)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="revenue"
                                        nameKey="name"
                                    >
                                        {data.categoryPerformance.slice(0, 6).map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "12px" }}
                                        formatter={(value) => [`$${value.toLocaleString()}`, "Revenus"]}
                                    />
                                    <Legend />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Top Products & Category Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Top Produits Rentables</h3>
                                <p className="text-warm-400 text-sm">Par revenus générés</p>
                            </div>
                            <Award className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {data.topProducts.map((product, index) => (
                                <div key={product.id} className="flex items-center gap-3 p-3 bg-warm-800/50 rounded-xl">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? "bg-amber-500 text-warm-900" :
                                            index === 1 ? "bg-gray-400 text-warm-900" :
                                                index === 2 ? "bg-amber-700 text-white" :
                                                    "bg-warm-700 text-warm-300"
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{product.name}</p>
                                        <p className="text-warm-500 text-sm">{product.category} • {product.quantity} vendus</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-teal-400 font-semibold">${product.revenue.toFixed(0)}</p>
                                        <p className="text-warm-500 text-sm">Profit: ${product.profit.toFixed(0)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category Performance Table */}
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Performance Catégories</h3>
                                <p className="text-warm-400 text-sm">Analyse comparative</p>
                            </div>
                            <BarChart2 className="w-5 h-5 text-teal-500" />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-warm-800">
                                        <th className="text-left py-2 text-warm-400 text-sm font-medium">Catégorie</th>
                                        <th className="text-right py-2 text-warm-400 text-sm font-medium">Revenus</th>
                                        <th className="text-right py-2 text-warm-400 text-sm font-medium">Marge</th>
                                        <th className="text-right py-2 text-warm-400 text-sm font-medium">Produits</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.categoryPerformance.slice(0, 8).map((cat, index) => (
                                        <tr key={cat.name} className="border-b border-warm-800/50">
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                    />
                                                    <span className="text-white">{cat.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right text-teal-400 font-medium">
                                                ${cat.revenue.toLocaleString()}
                                            </td>
                                            <td className="py-3 text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${cat.profitMargin >= 35 ? "bg-teal-500/20 text-teal-400" :
                                                        cat.profitMargin >= 25 ? "bg-amber-500/20 text-amber-400" :
                                                            "bg-coral-500/20 text-coral-400"
                                                    }`}>
                                                    {cat.profitMargin.toFixed(0)}%
                                                </span>
                                            </td>
                                            <td className="py-3 text-right text-warm-300">
                                                {cat.productCount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-4 text-center">
                        <p className="text-warm-400 text-sm mb-1">Revenu / Produit</p>
                        <p className="text-xl font-bold text-white">${data.kpis.revenuePerProduct.toFixed(0)}</p>
                    </div>
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-4 text-center">
                        <p className="text-warm-400 text-sm mb-1">Revenu / Catégorie</p>
                        <p className="text-xl font-bold text-white">${data.kpis.revenuePerCategory.toFixed(0)}</p>
                    </div>
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-4 text-center">
                        <p className="text-warm-400 text-sm mb-1">Produits Actifs</p>
                        <p className="text-xl font-bold text-white">{data.kpis.productCount}</p>
                    </div>
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-4 text-center">
                        <p className="text-warm-400 text-sm mb-1">Catégories</p>
                        <p className="text-xl font-bold text-white">{data.kpis.categoryCount}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
