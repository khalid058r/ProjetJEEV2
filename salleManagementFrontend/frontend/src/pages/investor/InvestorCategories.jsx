import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FolderTree, TrendingUp, TrendingDown, DollarSign, Package,
    Search, ArrowUpRight, ArrowDownRight, Eye, Star,
    BarChart2, PieChart, ChevronRight, Layers, Target
} from "lucide-react";
import {
    PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";
import { getProducts } from "../../services/productService";
import { getSales } from "../../services/salesService";
import { getCategories } from "../../services/categoryService";

const COLORS = ["#FF5A5F", "#00A699", "#FC642D", "#FFB400", "#8B5CF6", "#EC4899"];

export default function InvestorCategories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("revenue");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsRes, salesRes, categoriesRes] = await Promise.all([
                getProducts().catch(() => ({ data: [] })),
                getSales().catch(() => ({ data: [] })),
                getCategories().catch(() => ({ data: [] }))
            ]);

            const productsData = Array.isArray(productsRes?.data) ? productsRes.data : [];
            const salesData = Array.isArray(salesRes?.data) ? salesRes.data : [];
            const categoriesData = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];

            // Calculate category statistics
            const categoryStats = categoriesData.map(category => {
                const categoryProducts = productsData.filter(p => p.categoryId === category.id);

                // Get all sales for this category
                const categorySales = salesData.flatMap(sale =>
                    (sale.lignes || []).filter(l => {
                        const product = productsData.find(p => p.id === l.productId);
                        return product?.categoryId === category.id;
                    }).map(l => ({
                        ...l,
                        saleDate: sale.saleDate
                    }))
                );

                const totalRevenue = categorySales.reduce((sum, l) =>
                    sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0
                );
                const totalQuantity = categorySales.reduce((sum, l) => sum + (l.quantity || 0), 0);
                const avgProductPrice = categoryProducts.length > 0
                    ? categoryProducts.reduce((sum, p) => sum + (p.price || 0), 0) / categoryProducts.length
                    : 0;

                // Calculate trend (last 7 days vs previous 7 days)
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

                const recentRevenue = categorySales
                    .filter(s => new Date(s.saleDate) >= weekAgo)
                    .reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);

                const previousRevenue = categorySales
                    .filter(s => {
                        const d = new Date(s.saleDate);
                        return d >= twoWeeksAgo && d < weekAgo;
                    })
                    .reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);

                const trend = previousRevenue > 0
                    ? ((recentRevenue - previousRevenue) / previousRevenue * 100)
                    : 0;

                // Profitability score
                const profitabilityScore = Math.min(100, Math.round(
                    (totalRevenue / 1000) * 10 +
                    (categoryProducts.length * 5) +
                    (trend > 0 ? 20 : 0)
                ));

                // Stock status
                const totalStock = categoryProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
                const lowStockProducts = categoryProducts.filter(p => p.stock < 5).length;

                return {
                    ...category,
                    productCount: categoryProducts.length,
                    totalRevenue,
                    totalQuantity,
                    avgProductPrice,
                    trend: parseFloat(trend.toFixed(1)),
                    profitabilityScore,
                    totalStock,
                    lowStockProducts,
                    topProduct: categoryProducts.reduce((top, p) => {
                        const pRevenue = categorySales
                            .filter(l => l.productId === p.id)
                            .reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);
                        return pRevenue > (top?.revenue || 0) ? { name: p.title, revenue: pRevenue } : top;
                    }, null)
                };
            });

            setCategories(categoryStats);
            setProducts(productsData);
            setSales(salesData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort categories
    const filteredCategories = categories
        .filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            switch (sortBy) {
                case "revenue": return b.totalRevenue - a.totalRevenue;
                case "products": return b.productCount - a.productCount;
                case "trend": return b.trend - a.trend;
                case "profitability": return b.profitabilityScore - a.profitabilityScore;
                default: return 0;
            }
        });

    // Summary calculations
    const totalRevenue = categories.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalProducts = products.length;
    const avgProfitability = categories.length > 0
        ? categories.reduce((sum, c) => sum + c.profitabilityScore, 0) / categories.length
        : 0;

    // Pie chart data
    const pieData = categories
        .filter(c => c.totalRevenue > 0)
        .map(c => ({ name: c.name, value: c.totalRevenue }))
        .slice(0, 6);

    const getProfitabilityColor = (score) => {
        if (score >= 70) return "text-teal-400";
        if (score >= 40) return "text-amber-400";
        return "text-coral-400";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-warm-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-teal-500/30 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-warm-400 font-medium">Chargement des catégories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warm-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <FolderTree className="w-8 h-8 text-teal-500" />
                            Analyse des Catégories
                        </h1>
                        <p className="text-warm-400 mt-1">
                            Rentabilité et performance par segment
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-4">
                        <div className="bg-warm-900/50 border border-warm-800 rounded-xl px-4 py-3">
                            <p className="text-warm-400 text-xs">Revenus Totaux</p>
                            <p className="text-xl font-bold text-teal-400">${totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-warm-900/50 border border-warm-800 rounded-xl px-4 py-3">
                            <p className="text-warm-400 text-xs">Catégories</p>
                            <p className="text-xl font-bold text-coral-400">{categories.length}</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards + Pie Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Summary Cards */}
                    <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/30 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-teal-500/20 rounded-xl">
                                    <DollarSign className="w-5 h-5 text-teal-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</p>
                            <p className="text-warm-400 text-sm mt-1">Revenus Totaux</p>
                        </div>

                        <div className="bg-gradient-to-br from-coral-500/20 to-coral-600/10 border border-coral-500/30 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-coral-500/20 rounded-xl">
                                    <Package className="w-5 h-5 text-coral-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">{totalProducts}</p>
                            <p className="text-warm-400 text-sm mt-1">Produits</p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-amber-500/20 rounded-xl">
                                    <Target className="w-5 h-5 text-amber-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">{avgProfitability.toFixed(0)}%</p>
                            <p className="text-warm-400 text-sm mt-1">Rentabilité Moy.</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-500/20 rounded-xl">
                                    <Layers className="w-5 h-5 text-purple-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">{categories.length}</p>
                            <p className="text-warm-400 text-sm mt-1">Catégories</p>
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-5">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-coral-500" />
                            Répartition des Revenus
                        </h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "12px" }}
                                        formatter={(value) => [`$${value.toLocaleString()}`, "Revenus"]}
                                    />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-warm-500" />
                            <input
                                type="text"
                                placeholder="Rechercher une catégorie..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-warm-800 border border-warm-700 rounded-xl text-white placeholder:text-warm-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2.5 bg-warm-800 border border-warm-700 rounded-xl text-white focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="revenue">Trier par Revenus</option>
                            <option value="products">Trier par Produits</option>
                            <option value="trend">Trier par Tendance</option>
                            <option value="profitability">Trier par Rentabilité</option>
                        </select>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCategories.map((category, index) => (
                        <div
                            key={category.id}
                            onClick={() => navigate(`/investisseur/categories/${category.id}`)}
                            className="bg-warm-900/50 border border-warm-800 rounded-2xl p-5 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10 transition-all cursor-pointer group"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${COLORS[index % COLORS.length]}30` }}
                                    >
                                        <FolderTree
                                            className="w-6 h-6"
                                            style={{ color: COLORS[index % COLORS.length] }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                                            {category.name}
                                        </h3>
                                        <p className="text-warm-500 text-sm">{category.productCount} produits</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-warm-600 group-hover:text-teal-400 transition-colors" />
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-warm-800/50 rounded-xl p-3">
                                    <p className="text-warm-500 text-xs mb-1">Revenus</p>
                                    <p className="text-lg font-bold text-teal-400">
                                        ${category.totalRevenue.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-warm-800/50 rounded-xl p-3">
                                    <p className="text-warm-500 text-xs mb-1">Vendus</p>
                                    <p className="text-lg font-bold text-white">
                                        {category.totalQuantity} unités
                                    </p>
                                </div>
                            </div>

                            {/* Trend */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {category.trend >= 0 ? (
                                        <ArrowUpRight className="w-4 h-4 text-teal-400" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4 text-coral-400" />
                                    )}
                                    <span className={category.trend >= 0 ? "text-teal-400" : "text-coral-400"}>
                                        {category.trend > 0 ? "+" : ""}{category.trend}%
                                    </span>
                                    <span className="text-warm-500 text-sm">vs semaine passée</span>
                                </div>
                            </div>

                            {/* Profitability Bar */}
                            <div className="mb-3">
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-warm-400">Rentabilité</span>
                                    <span className={getProfitabilityColor(category.profitabilityScore)}>
                                        {category.profitabilityScore}%
                                    </span>
                                </div>
                                <div className="h-2 bg-warm-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${category.profitabilityScore >= 70 ? "bg-teal-500" :
                                                category.profitabilityScore >= 40 ? "bg-amber-500" : "bg-coral-500"
                                            }`}
                                        style={{ width: `${category.profitabilityScore}%` }}
                                    />
                                </div>
                            </div>

                            {/* Top Product */}
                            {category.topProduct && (
                                <div className="pt-3 border-t border-warm-800">
                                    <p className="text-warm-500 text-xs mb-1">Meilleur Produit</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-warm-300 text-sm truncate flex-1">
                                            {category.topProduct.name}
                                        </p>
                                        <p className="text-teal-400 text-sm font-medium ml-2">
                                            ${category.topProduct.revenue.toFixed(0)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredCategories.length === 0 && (
                    <div className="text-center py-12">
                        <FolderTree className="w-16 h-16 text-warm-700 mx-auto mb-4" />
                        <p className="text-warm-400 text-lg">Aucune catégorie trouvée</p>
                    </div>
                )}
            </div>
        </div>
    );
}
