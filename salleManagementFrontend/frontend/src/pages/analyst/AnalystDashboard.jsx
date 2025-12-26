import { useEffect, useState, useMemo } from "react";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Package,
    Users,
    Target,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Zap,
    Award,
    BarChart3
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
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

import AnalyticsService from "../../services/analyticsService";
import { getSales } from "../../services/salesService";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";

import { formatCurrency, formatNumber, CHART_COLORS } from "../../utils/chartHelpers";

/**
 * AnalystDashboard - Main dashboard for analysts
 */
export default function AnalystDashboard() {
    const [loading, setLoading] = useState(true);
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
    const [recentInsights, setRecentInsights] = useState([]);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);

            const [salesRes, productsRes, categoriesRes] = await Promise.all([
                getSales().catch(err => { console.error("Sales error:", err); return { data: [] }; }),
                getProducts().catch(err => { console.error("Products error:", err); return { data: [] }; }),
                getCategories().catch(err => { console.error("Categories error:", err); return { data: [] }; })
            ]);

            // Debug: Log raw API responses
            console.log("=== RAW API RESPONSES ===");
            console.log("salesRes:", salesRes);
            console.log("productsRes:", productsRes);
            console.log("categoriesRes:", categoriesRes);

            // Ensure arrays with proper fallbacks
            const sales = Array.isArray(salesRes?.data) ? salesRes.data :
                (Array.isArray(salesRes) ? salesRes : []);
            const products = Array.isArray(productsRes?.data) ? productsRes.data :
                (Array.isArray(productsRes) ? productsRes : []);
            const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data :
                (Array.isArray(categoriesRes) ? categoriesRes : []);

            console.log("=== PARSED DATA ===");
            console.log("Sales:", sales.length, "Sample:", JSON.stringify(sales[0], null, 2));
            console.log("Products:", products.length, "Sample:", JSON.stringify(products[0], null, 2));
            console.log("Categories:", categories.length, "Sample:", JSON.stringify(categories[0], null, 2));

            // Calculate KPIs with safe access
            const totalRevenue = sales.reduce((sum, s) => {
                const amount = parseFloat(s?.totalAmount || s?.total || s?.montant || 0);
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            console.log("Calculated totalRevenue:", totalRevenue);
            const totalSales = sales.length;
            const avgBasket = totalSales > 0 ? totalRevenue / totalSales : 0;

            // Calculate growth rate from data
            const now = new Date();
            const thisMonth = sales.filter(s => {
                const saleDate = new Date(s?.saleDate || s?.createdAt || s?.date);
                return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
            });
            const lastMonth = sales.filter(s => {
                const saleDate = new Date(s?.saleDate || s?.createdAt || s?.date);
                const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
                return saleDate.getMonth() === lastMonthDate.getMonth() && saleDate.getFullYear() === lastMonthDate.getFullYear();
            });
            const thisMonthRevenue = thisMonth.reduce((sum, s) => sum + parseFloat(s?.totalAmount || s?.total || 0), 0);
            const lastMonthRevenue = lastMonth.reduce((sum, s) => sum + parseFloat(s?.totalAmount || s?.total || 0), 0);
            const growthRate = lastMonthRevenue > 0
                ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
                : (thisMonthRevenue > 0 ? 100 : 0);

            setKpis({
                totalRevenue,
                totalSales,
                avgBasket,
                totalProducts: products.length,
                totalCategories: categories.length,
                growthRate: parseFloat(growthRate)
            });

            // Build sales trend
            const dailyMap = {};
            sales.forEach(sale => {
                const rawDate = sale?.saleDate || sale?.createdAt || sale?.date;
                const date = rawDate ? rawDate.split('T')[0] : new Date().toISOString().split('T')[0];
                if (!dailyMap[date]) {
                    dailyMap[date] = { date, revenue: 0, orders: 0 };
                }
                dailyMap[date].revenue += parseFloat(sale?.totalAmount || sale?.total || 0);
                dailyMap[date].orders += 1;
            });
            setSalesTrend(Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14));

            // Category stats - try to get from products directly first
            const catMap = {};

            // Method 1: From products if they have category info
            products.forEach(product => {
                const categoryName = product?.categoryName || product?.category?.name || product?.categorie;
                if (categoryName) {
                    if (!catMap[categoryName]) {
                        catMap[categoryName] = { name: categoryName, revenue: 0, count: 0 };
                    }
                    catMap[categoryName].count += 1;
                    catMap[categoryName].revenue += parseFloat(product?.price || product?.prix || 0) * (product?.quantitySold || 1);
                }
            });

            // Method 2: From sales if products method didn't work
            if (Object.keys(catMap).length === 0) {
                sales.forEach(sale => {
                    const lignes = sale?.lignes || sale?.lignesVente || sale?.saleLines || sale?.items || [];
                    lignes.forEach(ligne => {
                        const productId = ligne?.productId || ligne?.product?.id || ligne?.produitId;
                        const product = products.find(p => p.id === productId);
                        if (product) {
                            const categoryName = product?.category?.name || product?.categoryName || categories.find(c => c.id === product?.categoryId)?.name || 'Autre';
                            if (!catMap[categoryName]) {
                                catMap[categoryName] = { name: categoryName, revenue: 0, count: 0 };
                            }
                            const qty = parseFloat(ligne?.quantity || ligne?.quantite || 1);
                            const price = parseFloat(ligne?.unitPrice || ligne?.prixUnitaire || product?.price || 0);
                            catMap[categoryName].revenue += qty * price;
                            catMap[categoryName].count += 1;
                        }
                    });
                });
            }

            // If still empty, create from categories
            if (Object.keys(catMap).length === 0) {
                categories.forEach(cat => {
                    catMap[cat.name || cat.nom] = {
                        name: cat.name || cat.nom,
                        revenue: 0,
                        count: products.filter(p => p.categoryId === cat.id).length
                    };
                });
            }

            setCategoryStats(Object.values(catMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

            // Top products - try multiple approaches
            const productMap = {};

            // From sales lines
            sales.forEach(sale => {
                const lignes = sale?.lignes || sale?.lignesVente || sale?.saleLines || sale?.items || [];
                lignes.forEach(ligne => {
                    const productId = ligne?.productId || ligne?.product?.id || ligne?.produitId;
                    if (productId) {
                        if (!productMap[productId]) {
                            const product = products.find(p => p.id === productId);
                            productMap[productId] = {
                                id: productId,
                                title: ligne?.productTitle || product?.title || product?.name || `Produit ${productId}`,
                                quantity: 0,
                                revenue: 0
                            };
                        }
                        productMap[productId].quantity += parseFloat(ligne?.quantity || ligne?.quantite || 1);
                        productMap[productId].revenue += parseFloat(ligne?.quantity || 1) * parseFloat(ligne?.unitPrice || ligne?.prixUnitaire || 0);
                    }
                });
            });

            // If no sales lines, use products directly
            if (Object.keys(productMap).length === 0) {
                products.slice(0, 5).forEach(product => {
                    productMap[product.id] = {
                        id: product.id,
                        title: product?.title || product?.name || product?.nom,
                        quantity: product?.quantitySold || 0,
                        revenue: (product?.quantitySold || 0) * parseFloat(product?.price || product?.prix || 0)
                    };
                });
            }

            setTopProducts(Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

            // Generate insights
            const lowStockCount = products.filter(p => (p?.stock || p?.quantity || 0) < 5).length;
            setRecentInsights([
                {
                    type: "success",
                    title: "Croissance",
                    message: `Le revenu ${growthRate >= 0 ? 'a augmenté' : 'a diminué'} de ${Math.abs(growthRate)}% ce mois-ci.`,
                    icon: growthRate >= 0 ? TrendingUp : TrendingDown
                },
                {
                    type: lowStockCount > 0 ? "warning" : "success",
                    title: lowStockCount > 0 ? "Stock Bas" : "Stock OK",
                    message: lowStockCount > 0
                        ? `${lowStockCount} produit(s) en stock critique.`
                        : "Tous les produits ont un stock suffisant.",
                    icon: Package
                },
                {
                    type: "info",
                    title: "Activité",
                    message: `${totalSales} ventes réalisées pour un total de ${formatCurrency(totalRevenue)}.`,
                    icon: Activity
                }
            ]);

        } catch (error) {
            console.error("Erreur chargement dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 animate-spin">
                            <div className="absolute inset-2 bg-white rounded-full"></div>
                        </div>
                        <BarChart3 className="absolute inset-0 m-auto w-8 h-8 text-indigo-600" />
                    </div>
                    <p className="text-gray-700 font-semibold">Chargement du Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Analyste</h1>
                    <p className="text-gray-500 mt-1">Vue d'ensemble des performances</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KPICard
                    title="Revenu Total"
                    value={formatCurrency(kpis.totalRevenue)}
                    change={15.3}
                    icon={DollarSign}
                    color="green"
                />
                <KPICard
                    title="Ventes Totales"
                    value={formatNumber(kpis.totalSales)}
                    change={8.2}
                    icon={ShoppingCart}
                    color="blue"
                />
                <KPICard
                    title="Panier Moyen"
                    value={formatCurrency(kpis.avgBasket)}
                    change={3.5}
                    icon={Target}
                    color="purple"
                />
                <KPICard
                    title="Produits"
                    value={formatNumber(kpis.totalProducts)}
                    change={null}
                    icon={Package}
                    color="indigo"
                />
                <KPICard
                    title="Catégories"
                    value={formatNumber(kpis.totalCategories)}
                    change={null}
                    icon={BarChart3}
                    color="orange"
                />
                <KPICard
                    title="Croissance"
                    value={`${kpis.growthRate}%`}
                    change={null}
                    icon={TrendingUp}
                    color="green"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendance des Ventes (14 jours)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={salesTrend}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [formatCurrency(value), 'Revenu']}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Pie */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Catégorie</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryStats}
                                dataKey="revenue"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={40}
                            >
                                {categoryStats.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        Top 5 Produits
                    </h3>
                    <div className="space-y-3">
                        {topProducts.map((product, idx) => (
                            <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">{product.title}</p>
                                        <p className="text-xs text-gray-500">{product.quantity} vendus</p>
                                    </div>
                                </div>
                                <span className="font-semibold text-green-600">{formatCurrency(product.revenue)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Insights */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Insights Récents
                    </h3>
                    <div className="space-y-3">
                        {recentInsights.map((insight, idx) => {
                            const Icon = insight.icon;
                            const colorMap = {
                                success: 'bg-green-50 border-green-200 text-green-800',
                                warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                                info: 'bg-blue-50 border-blue-200 text-blue-800'
                            };
                            return (
                                <div key={idx} className={`p-4 rounded-xl border ${colorMap[insight.type]}`}>
                                    <div className="flex items-start gap-3">
                                        <Icon className="w-5 h-5 mt-0.5" />
                                        <div>
                                            <p className="font-semibold">{insight.title}</p>
                                            <p className="text-sm mt-1 opacity-80">{insight.message}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple KPI Card component for this page
function KPICard({ title, value, change, icon: Icon, color }) {
    const colorClasses = {
        green: 'from-green-500 to-emerald-500',
        blue: 'from-blue-500 to-cyan-500',
        purple: 'from-purple-500 to-violet-500',
        indigo: 'from-indigo-500 to-blue-500',
        orange: 'from-orange-500 to-amber-500',
        red: 'from-red-500 to-rose-500'
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white`}>
                    <Icon className="w-5 h-5" />
                </div>
                {change !== null && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{title}</div>
        </div>
    );
}
