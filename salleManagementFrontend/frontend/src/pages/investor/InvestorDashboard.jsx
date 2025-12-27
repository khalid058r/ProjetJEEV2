import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    DollarSign, TrendingUp, TrendingDown, ShoppingCart, Package,
    FolderTree, AlertTriangle, Award, ArrowUpRight, ArrowDownRight,
    Eye, RefreshCw, Activity, Users, Target
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { getProducts } from "../../services/productService";
import { getSales } from "../../services/salesService";
import { getCategories } from "../../services/categoryService";

const COLORS = ["#FF5A5F", "#00A699", "#FC642D", "#FFB400", "#8B5CF6", "#EC4899"];

export default function InvestorDashboard() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

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

            // === Calculate KPIs ===
            const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
            const totalOrders = sales.length;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Inventory value
            const inventoryValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stockQuantity || 0)), 0);

            // Low stock alerts
            const lowStockProducts = products.filter(p => (p.stockQuantity || 0) < 5);

            // Growth calculation (vs previous 30 days)
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

            const currentPeriodSales = sales.filter(s => new Date(s.saleDate) >= thirtyDaysAgo);
            const previousPeriodSales = sales.filter(s => {
                const d = new Date(s.saleDate);
                return d >= sixtyDaysAgo && d < thirtyDaysAgo;
            });

            const currentRevenue = currentPeriodSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
            const previousRevenue = previousPeriodSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
            const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;

            // === Revenue Trend (Last 7 Days) ===
            const dailyRevenue = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dateStr = date.toISOString().split("T")[0];
                const daySales = sales.filter(s => s.saleDate?.startsWith(dateStr));
                const revenue = daySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
                const orders = daySales.length;
                dailyRevenue.push({
                    date: date.toLocaleDateString("fr", { weekday: "short", day: "numeric" }),
                    revenue,
                    orders
                });
            }

            // === Top Products ===
            const productPerformance = products.map(prod => {
                const prodSales = sales.flatMap(s =>
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
                    stock: prod.stockQuantity || 0
                };
            }).sort((a, b) => b.revenue - a.revenue);

            // === Category Distribution ===
            const categoryRevenue = categories.map(cat => {
                const catProducts = products.filter(p => p.categoryId === cat.id);
                const revenue = sales.flatMap(s =>
                    (s.lignes || []).filter(l => {
                        const prod = products.find(p => p.id === l.productId);
                        return prod?.categoryId === cat.id;
                    })
                ).reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);

                return {
                    name: cat.name,
                    value: revenue,
                    products: catProducts.length
                };
            }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

            // === Recent Sales ===
            const recentSales = sales
                .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
                .slice(0, 5)
                .map(sale => ({
                    id: sale.id,
                    date: new Date(sale.saleDate).toLocaleDateString("fr"),
                    amount: sale.totalAmount,
                    items: (sale.lignes || []).length
                }));

            setData({
                kpis: {
                    totalRevenue,
                    totalOrders,
                    avgOrderValue,
                    inventoryValue,
                    revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
                    productCount: products.length,
                    categoryCount: categories.length,
                    lowStockCount: lowStockProducts.length
                },
                dailyRevenue,
                topProducts: productPerformance.slice(0, 5),
                categoryRevenue: categoryRevenue.slice(0, 6),
                lowStockProducts: lowStockProducts.slice(0, 5),
                recentSales
            });

        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-amber-500/30 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-warm-400 font-medium">Chargement du dashboard...</p>
                </div>
            </div>
        );
    }

    const KPICard = ({ title, value, subtitle, icon: Icon, color, trend, link }) => (
        <Link to={link} className="block">
            <div className={`bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300 cursor-pointer`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? "text-teal-300" : "text-coral-300"}`}>
                            {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-white/70 text-sm mt-1">{title}</p>
                {subtitle && <p className="text-white/50 text-xs mt-1">{subtitle}</p>}
            </div>
        </Link>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Bienvenue, Investisseur</h1>
                    <p className="text-warm-400 mt-1">Vue d'ensemble de votre portefeuille</p>
                </div>
                <button
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="p-2.5 bg-warm-800 hover:bg-warm-700 border border-warm-700 rounded-xl transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 text-warm-300 ${refreshing ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Chiffre d'Affaires"
                    value={`$${data.kpis.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="from-amber-500/30 to-amber-600/20"
                    trend={data.kpis.revenueGrowth}
                    link="/investisseur/financial"
                />
                <KPICard
                    title="Commandes"
                    value={data.kpis.totalOrders.toLocaleString()}
                    subtitle={`Panier moyen: $${data.kpis.avgOrderValue.toFixed(2)}`}
                    icon={ShoppingCart}
                    color="from-teal-500/30 to-teal-600/20"
                    link="/investisseur/financial"
                />
                <KPICard
                    title="Produits"
                    value={data.kpis.productCount}
                    subtitle={`${data.kpis.categoryCount} catégories`}
                    icon={Package}
                    color="from-purple-500/30 to-purple-600/20"
                    link="/investisseur/products"
                />
                <KPICard
                    title="Alertes Stock"
                    value={data.kpis.lowStockCount}
                    subtitle="Produits en rupture imminente"
                    icon={AlertTriangle}
                    color="from-coral-500/30 to-coral-600/20"
                    link="/investisseur/products"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <div className="lg:col-span-2 bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Évolution des Revenus</h3>
                            <p className="text-warm-400 text-sm">7 derniers jours</p>
                        </div>
                        <Activity className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.dailyRevenue}>
                                <defs>
                                    <linearGradient id="revenueGradDash" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "12px" }}
                                    formatter={(value, name) => [name === "revenue" ? `$${value}` : value, name === "revenue" ? "Revenus" : "Commandes"]}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#F59E0B" fill="url(#revenueGradDash)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Par Catégorie</h3>
                            <p className="text-warm-400 text-sm">Distribution revenus</p>
                        </div>
                        <Link to="/investisseur/categories">
                            <Eye className="w-5 h-5 text-warm-400 hover:text-teal-400 transition-colors" />
                        </Link>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.categoryRevenue}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {data.categoryRevenue.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "12px" }}
                                    formatter={(value) => [`$${value.toLocaleString()}`, "Revenus"]}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Top Produits</h3>
                            <p className="text-warm-400 text-sm">Par revenus générés</p>
                        </div>
                        <Link to="/investisseur/products">
                            <Eye className="w-5 h-5 text-warm-400 hover:text-teal-400 transition-colors" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {data.topProducts.map((product, index) => (
                            <Link key={product.id} to={`/investisseur/products/${product.id}`}>
                                <div className="flex items-center gap-3 p-3 bg-warm-800/50 rounded-xl hover:bg-warm-800 transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? "bg-amber-500 text-warm-900" :
                                            index === 1 ? "bg-gray-400 text-warm-900" :
                                                index === 2 ? "bg-amber-700 text-white" :
                                                    "bg-warm-700 text-warm-300"
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{product.name}</p>
                                        <p className="text-warm-500 text-sm">{product.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-teal-400 font-semibold">${product.revenue.toFixed(0)}</p>
                                        <p className="text-warm-500 text-sm">{product.quantity} vendus</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-coral-500" />
                            <h3 className="text-lg font-semibold text-white">Alertes Stock Faible</h3>
                        </div>
                        <span className="px-2 py-1 bg-coral-500/20 text-coral-400 rounded-full text-xs font-medium">
                            {data.lowStockProducts.length} alertes
                        </span>
                    </div>
                    <div className="space-y-3">
                        {data.lowStockProducts.length === 0 ? (
                            <div className="text-center py-8 text-warm-500">
                                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Aucune alerte de stock</p>
                            </div>
                        ) : (
                            data.lowStockProducts.map(product => (
                                <Link key={product.id} to={`/investisseur/products/${product.id}`}>
                                    <div className="flex items-center justify-between p-3 bg-coral-500/10 border border-coral-500/30 rounded-xl hover:bg-coral-500/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-coral-500/20 rounded-lg">
                                                <Package className="w-4 h-4 text-coral-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{product.title}</p>
                                                <p className="text-warm-500 text-sm">Stock critique</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-coral-500 text-white rounded-full text-sm font-bold">
                                            {product.stockQuantity || 0}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
