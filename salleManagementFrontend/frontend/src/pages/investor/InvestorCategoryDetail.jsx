import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, FolderTree, TrendingUp, DollarSign, Package,
    ShoppingCart, Users, BarChart2, Target, Award,
    ArrowUpRight, ArrowDownRight, Zap, Layers, Star
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { getProducts } from "../../services/productService";
import { getSales } from "../../services/salesService";
import { getCategories } from "../../services/categoryService";

const COLORS = ["#FF5A5F", "#00A699", "#FC642D", "#FFB400", "#8B5CF6", "#EC4899"];

export default function InvestorCategoryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategoryData();
    }, [id]);

    const loadCategoryData = async () => {
        try {
            setLoading(true);
            const [productsRes, salesRes, categoriesRes] = await Promise.all([
                getProducts().catch(() => ({ data: [] })),
                getSales().catch(() => ({ data: [] })),
                getCategories().catch(() => ({ data: [] }))
            ]);

            const products = Array.isArray(productsRes?.data) ? productsRes.data : [];
            const sales = Array.isArray(salesRes?.data) ? salesRes.data : [];
            const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];

            const categoryData = categories.find(c => c.id === parseInt(id));
            if (!categoryData) {
                navigate("/investisseur/categories");
                return;
            }

            // Get category products
            const categoryProducts = products.filter(p => p.categoryId === categoryData.id);

            // Get all sales for this category
            const categorySales = sales.flatMap(sale =>
                (sale.lignes || [])
                    .filter(l => {
                        const product = products.find(p => p.id === l.productId);
                        return product?.categoryId === categoryData.id;
                    })
                    .map(l => ({
                        ...l,
                        saleDate: sale.saleDate,
                        productName: products.find(p => p.id === l.productId)?.title || "Unknown"
                    }))
            );

            // Calculate daily revenue
            const dailyData = {};
            categorySales.forEach(sale => {
                const date = sale.saleDate?.split("T")[0] || new Date().toISOString().split("T")[0];
                if (!dailyData[date]) {
                    dailyData[date] = { date, revenue: 0, quantity: 0, orders: 0 };
                }
                dailyData[date].revenue += (sale.quantity || 0) * (sale.unitPrice || 0);
                dailyData[date].quantity += sale.quantity || 0;
                dailyData[date].orders += 1;
            });

            const dailyArray = Object.values(dailyData)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(-30);

            // Product performance within category
            const productPerformance = categoryProducts.map(product => {
                const productSales = categorySales.filter(l => l.productId === product.id);
                const revenue = productSales.reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);
                const quantity = productSales.reduce((sum, l) => sum + (l.quantity || 0), 0);

                return {
                    id: product.id,
                    name: product.title,
                    revenue,
                    quantity,
                    stock: product.stock || 0,
                    price: product.price || 0,
                    contribution: 0 // Will calculate after
                };
            }).sort((a, b) => b.revenue - a.revenue);

            // Calculate contribution percentages
            const totalCategoryRevenue = productPerformance.reduce((sum, p) => sum + p.revenue, 0);
            productPerformance.forEach(p => {
                p.contribution = totalCategoryRevenue > 0 ? (p.revenue / totalCategoryRevenue * 100) : 0;
            });

            // Price distribution
            const priceRanges = [
                { range: "$0-25", min: 0, max: 25, count: 0, revenue: 0 },
                { range: "$25-50", min: 25, max: 50, count: 0, revenue: 0 },
                { range: "$50-100", min: 50, max: 100, count: 0, revenue: 0 },
                { range: "$100-200", min: 100, max: 200, count: 0, revenue: 0 },
                { range: "$200+", min: 200, max: Infinity, count: 0, revenue: 0 }
            ];

            categoryProducts.forEach(product => {
                const range = priceRanges.find(r => product.price >= r.min && product.price < r.max);
                if (range) {
                    range.count += 1;
                    const productRevenue = categorySales
                        .filter(l => l.productId === product.id)
                        .reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);
                    range.revenue += productRevenue;
                }
            });

            // Weekly trend
            const weeklyData = [];
            const now = new Date();
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
                const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

                const weekSales = categorySales.filter(s => {
                    const d = new Date(s.saleDate);
                    return d >= weekStart && d < weekEnd;
                });

                weeklyData.push({
                    week: `Sem ${4 - i}`,
                    revenue: weekSales.reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0),
                    quantity: weekSales.reduce((sum, l) => sum + (l.quantity || 0), 0)
                });
            }

            // Calculate KPIs
            const totalRevenue = categorySales.reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);
            const totalQuantity = categorySales.reduce((sum, l) => sum + (l.quantity || 0), 0);
            const avgOrderValue = categorySales.length > 0 ? totalRevenue / categorySales.length : 0;
            const avgProductPrice = categoryProducts.length > 0
                ? categoryProducts.reduce((sum, p) => sum + (p.price || 0), 0) / categoryProducts.length
                : 0;

            // Market share (simulated - percentage of total sales)
            const totalAllSales = sales.flatMap(s => s.lignes || [])
                .reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);
            const marketShare = totalAllSales > 0 ? (totalRevenue / totalAllSales * 100) : 0;

            // Growth trend
            const firstHalf = dailyArray.slice(0, Math.floor(dailyArray.length / 2))
                .reduce((sum, d) => sum + d.revenue, 0);
            const secondHalf = dailyArray.slice(Math.floor(dailyArray.length / 2))
                .reduce((sum, d) => sum + d.revenue, 0);
            const growthTrend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100) : 0;

            // Stock health
            const totalStock = categoryProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
            const lowStockProducts = categoryProducts.filter(p => p.stock < 5);
            const stockHealthScore = categoryProducts.length > 0
                ? ((categoryProducts.length - lowStockProducts.length) / categoryProducts.length * 100)
                : 100;

            // Category rank
            const categoryRankings = categories.map(cat => {
                const catProducts = products.filter(p => p.categoryId === cat.id);
                const catSales = sales.flatMap(s => (s.lignes || []).filter(l => {
                    const prod = products.find(p => p.id === l.productId);
                    return prod?.categoryId === cat.id;
                }));
                return {
                    id: cat.id,
                    revenue: catSales.reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0)
                };
            }).sort((a, b) => b.revenue - a.revenue);

            const categoryRank = categoryRankings.findIndex(c => c.id === categoryData.id) + 1;

            setCategory(categoryData);
            setStats({
                totalRevenue,
                totalQuantity,
                avgOrderValue,
                avgProductPrice,
                marketShare: parseFloat(marketShare.toFixed(1)),
                growthTrend: parseFloat(growthTrend.toFixed(1)),
                stockHealthScore: parseFloat(stockHealthScore.toFixed(0)),
                totalStock,
                lowStockCount: lowStockProducts.length,
                categoryRank,
                totalCategories: categories.length,
                productCount: categoryProducts.length,
                dailyData: dailyArray,
                weeklyData,
                productPerformance: productPerformance.slice(0, 10),
                priceDistribution: priceRanges.filter(r => r.count > 0),
                lowStockProducts
            });

        } catch (error) {
            console.error("Error loading category:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !category || !stats) {
        return (
            <div className="min-h-screen bg-warm-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-teal-500/30 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-warm-400 font-medium">Chargement des données...</p>
                </div>
            </div>
        );
    }

    const KPICard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
        <div className={`bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-5`}>
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
    );

    return (
        <div className="min-h-screen bg-warm-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/investisseur/categories")}
                        className="p-2 bg-warm-800 hover:bg-warm-700 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-warm-300" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <FolderTree className="w-8 h-8 text-teal-500" />
                            {category.name}
                        </h1>
                        <p className="text-warm-400 flex items-center gap-2 mt-1">
                            <span>{stats.productCount} produits</span>
                            <span>•</span>
                            <span>Rang #{stats.categoryRank} sur {stats.totalCategories}</span>
                            <span>•</span>
                            <span>{stats.marketShare}% part de marché</span>
                        </p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Revenus Totaux"
                        value={`$${stats.totalRevenue.toLocaleString()}`}
                        icon={DollarSign}
                        color="from-teal-500/30 to-teal-600/20"
                        trend={stats.growthTrend}
                    />
                    <KPICard
                        title="Unités Vendues"
                        value={stats.totalQuantity.toLocaleString()}
                        subtitle={`Prix moyen: $${stats.avgProductPrice.toFixed(2)}`}
                        icon={ShoppingCart}
                        color="from-coral-500/30 to-coral-600/20"
                    />
                    <KPICard
                        title="Part de Marché"
                        value={`${stats.marketShare}%`}
                        subtitle={`Rang #${stats.categoryRank}`}
                        icon={Target}
                        color="from-amber-500/30 to-amber-600/20"
                    />
                    <KPICard
                        title="Santé du Stock"
                        value={`${stats.stockHealthScore}%`}
                        subtitle={`${stats.lowStockCount} produits en alerte`}
                        icon={Layers}
                        color="from-purple-500/30 to-purple-600/20"
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trend */}
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Tendance des Revenus</h3>
                                <p className="text-warm-400 text-sm">30 derniers jours</p>
                            </div>
                            <TrendingUp className="w-5 h-5 text-teal-500" />
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.dailyData}>
                                    <defs>
                                        <linearGradient id="catRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00A699" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00A699" stopOpacity={0} />
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
                                        formatter={(value) => [`$${value.toFixed(2)}`, "Revenus"]}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#00A699" strokeWidth={2} fill="url(#catRevenueGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Weekly Comparison */}
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Comparaison Hebdomadaire</h3>
                                <p className="text-warm-400 text-sm">4 dernières semaines</p>
                            </div>
                            <BarChart2 className="w-5 h-5 text-coral-500" />
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="week" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "12px" }}
                                    />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#FF5A5F" radius={[4, 4, 0, 0]} name="Revenus ($)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Product Performance */}
                <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Performance des Produits</h3>
                            <p className="text-warm-400 text-sm">Contribution au chiffre d'affaires</p>
                        </div>
                        <Star className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Products List */}
                        <div className="space-y-3">
                            {stats.productPerformance.map((product, index) => (
                                <div
                                    key={product.id}
                                    onClick={() => navigate(`/investisseur/products/${product.id}`)}
                                    className="flex items-center gap-3 p-3 bg-warm-800/50 rounded-xl hover:bg-warm-800 cursor-pointer transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? "bg-amber-500 text-warm-900" :
                                            index === 1 ? "bg-gray-400 text-warm-900" :
                                                index === 2 ? "bg-amber-700 text-white" :
                                                    "bg-warm-700 text-warm-300"
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{product.name}</p>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-warm-500">{product.quantity} vendus</span>
                                            <span className="text-warm-600">•</span>
                                            <span className="text-warm-500">Stock: {product.stock}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-teal-400 font-semibold">${product.revenue.toFixed(0)}</p>
                                        <p className="text-warm-500 text-sm">{product.contribution.toFixed(1)}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pie Chart */}
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.productPerformance.slice(0, 6)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="revenue"
                                        nameKey="name"
                                    >
                                        {stats.productPerformance.slice(0, 6).map((_, index) => (
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

                {/* Price Distribution & Low Stock */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Price Distribution */}
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Distribution des Prix</h3>
                                <p className="text-warm-400 text-sm">Revenus par gamme de prix</p>
                            </div>
                            <Zap className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.priceDistribution} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis type="number" stroke="#9CA3AF" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                                    <YAxis dataKey="range" type="category" width={60} stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "12px" }}
                                        formatter={(value, name) => [name === "revenue" ? `$${value.toLocaleString()}` : value, name === "revenue" ? "Revenus" : "Produits"]}
                                    />
                                    <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Alertes Stock Bas</h3>
                                <p className="text-warm-400 text-sm">{stats.lowStockProducts.length} produits concernés</p>
                            </div>
                            <div className="px-3 py-1 bg-coral-500/20 text-coral-400 rounded-full text-sm font-medium">
                                {stats.lowStockProducts.length} alertes
                            </div>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {stats.lowStockProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 bg-coral-500/10 border border-coral-500/20 rounded-xl"
                                >
                                    <div>
                                        <p className="text-white font-medium">{product.title}</p>
                                        <p className="text-coral-400 text-sm">Stock critique: {product.stock} unités</p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/investisseur/products/${product.id}`)}
                                        className="px-3 py-1 bg-coral-500/20 hover:bg-coral-500/30 text-coral-400 rounded-lg text-sm transition-colors"
                                    >
                                        Voir
                                    </button>
                                </div>
                            ))}
                            {stats.lowStockProducts.length === 0 && (
                                <div className="text-center py-6">
                                    <Layers className="w-12 h-12 text-teal-500/50 mx-auto mb-2" />
                                    <p className="text-teal-400">Tous les stocks sont sains!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
