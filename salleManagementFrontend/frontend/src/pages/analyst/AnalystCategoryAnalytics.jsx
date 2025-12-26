import { useEffect, useState } from 'react';
import {
    FolderTree,
    TrendingUp,
    TrendingDown,
    PieChart as PieIcon,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Layers,
    Package
} from 'lucide-react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Treemap,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

import { getCategories } from '../../services/categoryService';
import { getSales } from '../../services/salesService';
import { getProducts } from '../../services/productService';

import { CHART_COLORS, formatCurrency, formatNumber } from '../../utils/chartHelpers';

/**
 * AnalystCategoryAnalytics - Category performance analytics
 */
export default function AnalystCategoryAnalytics() {
    const [loading, setLoading] = useState(true);
    const [categoryPerformance, setCategoryPerformance] = useState([]);
    const [treemapData, setTreemapData] = useState([]);
    const [productDistribution, setProductDistribution] = useState([]);
    const [growthData, setGrowthData] = useState([]);

    const [kpis, setKpis] = useState({
        totalCategories: 0,
        avgRevenue: 0,
        topCategory: '',
        growthRate: 0
    });

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);

            const [categoriesRes, salesRes, productsRes] = await Promise.all([
                getCategories().catch(err => { console.error("Categories error:", err); return { data: [] }; }),
                getSales().catch(err => { console.error("Sales error:", err); return { data: [] }; }),
                getProducts().catch(err => { console.error("Products error:", err); return { data: [] }; })
            ]);

            // Safely extract arrays
            const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data :
                (Array.isArray(categoriesRes) ? categoriesRes : []);
            const sales = Array.isArray(salesRes?.data) ? salesRes.data :
                (Array.isArray(salesRes) ? salesRes : []);
            const products = Array.isArray(productsRes?.data) ? productsRes.data :
                (Array.isArray(productsRes) ? productsRes : []);

            console.log("Category Analytics:", { categories: categories.length, sales: sales.length, products: products.length, sampleCat: categories[0] });

            // Calculate category performance from sales
            const perfMap = {};
            categories.forEach(cat => {
                const catName = cat?.name || cat?.nom || cat?.title || `Catégorie ${cat?.id}`;
                perfMap[cat.id] = {
                    id: cat.id,
                    name: catName,
                    revenue: 0,
                    orders: 0,
                    productCount: 0
                };
            });

            // Count products per category with safe access
            products.forEach(prod => {
                const catId = prod?.category?.id || prod?.categoryId || prod?.categorieId;
                if (catId && perfMap[catId]) {
                    perfMap[catId].productCount += 1;
                }
            });

            // Calculate revenue per category with safe access
            sales.forEach(sale => {
                const lines = sale?.lignes || sale?.lignesVente || sale?.saleLines || sale?.items || [];
                lines.forEach(line => {
                    const productId = line?.productId || line?.product?.id;
                    const product = products.find(p => p.id === productId);
                    const catId = product?.category?.id || product?.categoryId;
                    const qty = parseFloat(line?.quantity || line?.quantite || 1);
                    const price = parseFloat(line?.unitPrice || line?.prixUnitaire || 0);
                    if (catId && perfMap[catId]) {
                        perfMap[catId].revenue += qty * price;
                        perfMap[catId].orders += 1;
                    }
                });
            });

            // If no sales data, calculate based on products
            if (sales.length === 0 && products.length > 0) {
                products.forEach(prod => {
                    const catId = prod?.category?.id || prod?.categoryId;
                    const price = parseFloat(prod?.price || prod?.prix || 0);
                    const sold = parseFloat(prod?.quantitySold || prod?.vendu || 0);
                    if (catId && perfMap[catId]) {
                        perfMap[catId].revenue += price * sold;
                    }
                });
            }

            const perf = Object.values(perfMap).sort((a, b) => b.revenue - a.revenue);
            setCategoryPerformance(perf);

            // Treemap data
            const treeData = perf.map(cat => ({
                name: cat.name,
                size: cat.revenue,
                fill: CHART_COLORS[perf.indexOf(cat) % CHART_COLORS.length]
            }));
            setTreemapData(treeData);

            // Product distribution
            const distData = perf.slice(0, 8).map(cat => ({
                name: cat.name,
                products: cat.productCount
            }));
            setProductDistribution(distData);

            // Simulate growth data
            const growth = perf.slice(0, 5).map(cat => ({
                name: cat.name,
                currentMonth: cat.revenue,
                lastMonth: cat.revenue * (0.7 + Math.random() * 0.5),
                growth: ((cat.revenue / (cat.revenue * 0.85)) - 1) * 100
            }));
            setGrowthData(growth);

            // KPIs
            const totalCategories = categories.length;
            const avgRevenue = perf.reduce((sum, c) => sum + c.revenue, 0) / perf.length || 0;
            const topCategory = perf[0]?.name || 'N/A';
            const avgGrowth = growth.reduce((sum, g) => sum + g.growth, 0) / growth.length || 0;

            setKpis({
                totalCategories,
                avgRevenue,
                topCategory,
                growthRate: avgGrowth
            });

        } catch (error) {
            console.error('Erreur chargement analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-violet-500 animate-spin">
                            <div className="absolute inset-2 bg-white rounded-full"></div>
                        </div>
                        <FolderTree className="absolute inset-0 m-auto w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-gray-700 font-semibold">Analyse des Catégories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg shadow-purple-500/25">
                            <FolderTree className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Analyse des Catégories</h1>
                    </div>
                    <p className="text-gray-500 mt-1 ml-12">Performance par catégorie de produits</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total Catégories" value={formatNumber(kpis.totalCategories)} icon={Layers} color="purple" />
                <KPICard title="Revenu Moyen" value={formatCurrency(kpis.avgRevenue)} icon={BarChart3} color="green" />
                <KPICard title="Top Catégorie" value={kpis.topCategory} icon={TrendingUp} color="blue" isText />
                <KPICard title="Croissance Moy." value={`${kpis.growthRate.toFixed(1)}%`} icon={TrendingUp} color="green" change={kpis.growthRate} />
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Category */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenu par Catégorie</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={categoryPerformance.slice(0, 8)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                {categoryPerformance.slice(0, 8).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Distribution (Pie) */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution des Revenus</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={categoryPerformance.slice(0, 6)}
                                dataKey="revenue"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={120}
                                paddingAngle={2}
                            >
                                {categoryPerformance.slice(0, 6).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Distribution */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-500" />
                        Produits par Catégorie
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={productDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 9, angle: -30 }} height={50} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="products" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Growth Comparison */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Croissance par Catégorie</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={growthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                            <Tooltip formatter={(v, name) => {
                                if (name === 'growth') return `${v.toFixed(1)}%`;
                                return formatCurrency(v);
                            }} />
                            <Legend />
                            <Bar dataKey="lastMonth" name="Mois Dernier" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="currentMonth" name="Ce Mois" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Cards */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Détail par Catégorie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categoryPerformance.slice(0, 8).map((cat, idx) => (
                        <div key={cat.id} className="p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                ></div>
                                <span className="font-medium text-gray-900">{cat.name}</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Revenu</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(cat.revenue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Produits</span>
                                    <span className="font-semibold text-gray-900">{cat.productCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ventes</span>
                                    <span className="font-semibold text-gray-900">{cat.orders}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon: Icon, color, change, isText }) {
    const colorClasses = {
        purple: 'from-purple-500 to-violet-500',
        green: 'from-green-500 to-emerald-500',
        blue: 'from-blue-500 to-cyan-500'
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white`}>
                    <Icon className="w-5 h-5" />
                </div>
                {change !== undefined && !isText && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change).toFixed(1)}%
                    </div>
                )}
            </div>
            <div className={`font-bold text-gray-900 ${isText ? 'text-lg truncate' : 'text-2xl'}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{title}</div>
        </div>
    );
}
