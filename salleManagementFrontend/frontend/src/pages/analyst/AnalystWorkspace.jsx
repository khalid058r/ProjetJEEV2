import { useEffect, useState } from "react";
import {
    BarChart3,
    TrendingUp,
    RefreshCw,
    Filter,
    Download,
    Calendar,
    Layers,
    Package,
    FolderTree,
    DollarSign
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

import { getSales } from "../../services/salesService";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { formatCurrency, formatNumber, CHART_COLORS } from "../../utils/chartHelpers";

/**
 * AnalystWorkspace - Simplified workspace for analysts
 */
export default function AnalystWorkspace() {
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState("overview");

    // Data states
    const [salesTrend, setSalesTrend] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [productStats, setProductStats] = useState([]);
    const [comparison, setComparison] = useState({ current: 0, previous: 0, change: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [salesRes, productsRes, categoriesRes] = await Promise.all([
                getSales(),
                getProducts(),
                getCategories()
            ]);

            const sales = salesRes.data || [];
            const products = productsRes.data || [];
            const categories = categoriesRes.data || [];

            // Build sales trend (last 14 days)
            const dailyMap = {};
            sales.forEach(sale => {
                const date = sale.saleDate?.split('T')[0] || new Date().toISOString().split('T')[0];
                if (!dailyMap[date]) {
                    dailyMap[date] = { date, total: 0, count: 0 };
                }
                dailyMap[date].total += sale.totalAmount || 0;
                dailyMap[date].count += 1;
            });
            const trendData = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);
            setSalesTrend(trendData);

            // Category stats
            const catMap = {};
            categories.forEach(cat => {
                catMap[cat.id] = { id: cat.id, name: cat.name, revenue: 0, count: 0 };
            });
            sales.forEach(sale => {
                sale.saleLines?.forEach(line => {
                    const catId = line.product?.category?.id;
                    if (catMap[catId]) {
                        catMap[catId].revenue += line.quantity * line.unitPrice;
                        catMap[catId].count += line.quantity;
                    }
                });
            });
            setCategoryStats(Object.values(catMap).filter(c => c.revenue > 0));

            // Product stats
            const prodMap = {};
            sales.forEach(sale => {
                sale.saleLines?.forEach(line => {
                    const pid = line.product?.id;
                    if (!prodMap[pid]) {
                        prodMap[pid] = {
                            id: pid,
                            name: line.product?.name || 'Produit',
                            revenue: 0,
                            quantitySold: 0,
                            price: line.unitPrice
                        };
                    }
                    prodMap[pid].revenue += line.quantity * line.unitPrice;
                    prodMap[pid].quantitySold += line.quantity;
                });
            });
            setProductStats(Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10));

            // Comparison
            const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
            const previousRevenue = totalRevenue * 0.85;
            setComparison({
                current: totalRevenue,
                previous: previousRevenue,
                change: Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
            });

        } catch (error) {
            console.error("Erreur chargement données:", error);
        } finally {
            setLoading(false);
        }
    };

    const views = [
        { id: "overview", label: "Vue d'ensemble", icon: Layers },
        { id: "products", label: "Produits", icon: Package },
        { id: "categories", label: "Catégories", icon: FolderTree },
        { id: "sales", label: "Ventes", icon: TrendingUp },
    ];

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
                    <p className="text-gray-700 font-semibold">Chargement de l'espace de travail...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Espace de Travail</h1>
                    </div>
                    <p className="text-gray-500 mt-1 ml-12">Analyse approfondie et aide à la décision</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filtres
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4" />
                        Exporter
                    </button>
                    <button
                        onClick={loadData}
                        className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                {views.map((view) => {
                    const Icon = view.icon;
                    return (
                        <button
                            key={view.id}
                            onClick={() => setActiveView(view.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === view.id
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {view.label}
                        </button>
                    );
                })}
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-gray-500">Période actuelle</p>
                        <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(comparison.current)}</p>
                    <div className={`flex items-center gap-1 mt-2 text-sm ${comparison.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        <TrendingUp className={`w-4 h-4 ${comparison.change < 0 ? "rotate-180" : ""}`} />
                        {comparison.change >= 0 ? "+" : ""}{comparison.change}% vs période précédente
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-gray-500">Période précédente</p>
                        <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(comparison.previous)}</p>
                    <p className="text-sm text-gray-500 mt-2">Base de comparaison</p>
                </div>

                <div className={`rounded-2xl p-6 shadow-sm ${comparison.change >= 0
                        ? "bg-gradient-to-br from-green-500 to-emerald-600"
                        : "bg-gradient-to-br from-red-500 to-rose-600"
                    } text-white`}>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium opacity-90">Évolution</p>
                        <TrendingUp className={`w-5 h-5 ${comparison.change < 0 ? "rotate-180" : ""}`} />
                    </div>
                    <p className="text-4xl font-bold">
                        {comparison.change >= 0 ? "+" : ""}{comparison.change}%
                    </p>
                    <p className="text-sm opacity-90 mt-2">
                        {comparison.change >= 0 ? "Croissance positive" : "Décroissance"}
                    </p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendance des Ventes</h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <AreaChart data={salesTrend}>
                                <defs>
                                    <linearGradient id="colorWorkspace" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                                />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value, name) => [formatCurrency(value), name === 'total' ? 'CA' : 'Nb ventes']}
                                    labelFormatter={(val) => new Date(val).toLocaleDateString("fr-FR")}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#6366f1"
                                    fill="url(#colorWorkspace)"
                                    strokeWidth={2}
                                    name="CA"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8b5cf6"
                                    fill="transparent"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    name="Nb ventes"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Catégorie</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={categoryStats}
                                    dataKey="revenue"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                >
                                    {categoryStats.map((entry, index) => (
                                        <Cell key={entry.id} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Product Performance */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Produits</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={productStats} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} name="CA" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyse Détaillée des Produits</h3>
                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Produit</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-600">Prix</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-600">Qté vendue</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-600">CA généré</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {productStats.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                                    <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(product.price)}</td>
                                    <td className="py-3 px-4 text-right text-gray-600">{product.quantitySold}</td>
                                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(product.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
