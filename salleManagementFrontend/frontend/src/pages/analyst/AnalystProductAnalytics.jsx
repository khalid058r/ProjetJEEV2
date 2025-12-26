import { useEffect, useState } from 'react';
import {
    Package,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Star,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter
} from 'lucide-react';
import {
    BarChart,
    Bar,
    ScatterChart,
    Scatter,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
    ZAxis
} from 'recharts';

import { getProducts } from '../../services/productService';
import { getSales } from '../../services/salesService';

import { CHART_COLORS, formatCurrency, formatNumber } from '../../utils/chartHelpers';

/**
 * AnalystProductAnalytics - Product performance analytics
 */
export default function AnalystProductAnalytics() {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [productPerformance, setProductPerformance] = useState([]);
    const [bcgData, setBcgData] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [stockDistribution, setStockDistribution] = useState([]);

    const [kpis, setKpis] = useState({
        totalProducts: 0,
        lowStockCount: 0,
        totalStockValue: 0,
        avgPerformance: 0
    });

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);

            const [productsRes, salesRes] = await Promise.all([
                getProducts().catch(err => { console.error("Products error:", err); return { data: [] }; }),
                getSales().catch(err => { console.error("Sales error:", err); return { data: [] }; })
            ]);

            // Ensure arrays with proper fallbacks
            const prods = Array.isArray(productsRes?.data) ? productsRes.data :
                (Array.isArray(productsRes) ? productsRes : []);
            const sales = Array.isArray(salesRes?.data) ? salesRes.data :
                (Array.isArray(salesRes) ? salesRes : []);

            console.log("Product Analytics loaded:", { productsCount: prods.length, salesCount: sales.length, sampleProduct: prods[0], sampleSale: sales[0] });

            setProducts(prods);

            // Calculate product performance with safe access
            const perfMap = {};
            sales.forEach(sale => {
                const lines = sale?.lignes || sale?.lignesVente || sale?.saleLines || sale?.items || [];
                lines.forEach(line => {
                    const pid = line?.productId || line?.product?.id || line?.produitId;
                    const product = prods.find(p => p.id === pid);
                    const productName = line?.productTitle || product?.title || product?.name || `Produit ${pid}`;
                    const qty = parseFloat(line?.quantity || line?.quantite || 1);
                    const price = parseFloat(line?.unitPrice || line?.prixUnitaire || 0);

                    if (pid) {
                        if (!perfMap[pid]) {
                            perfMap[pid] = {
                                id: pid,
                                name: productName,
                                revenue: 0,
                                quantity: 0
                            };
                        }
                        perfMap[pid].revenue += qty * price;
                        perfMap[pid].quantity += qty;
                    }
                });
            });

            // If no sales data, use products directly
            if (Object.keys(perfMap).length === 0 && prods.length > 0) {
                prods.forEach(p => {
                    perfMap[p.id] = {
                        id: p.id,
                        name: p?.name || p?.title || p?.nom || `Produit ${p.id}`,
                        revenue: parseFloat(p?.price || p?.prix || 0) * (p?.quantitySold || 0),
                        quantity: p?.quantitySold || 0
                    };
                });
            }

            const perf = Object.values(perfMap).sort((a, b) => b.revenue - a.revenue);
            setProductPerformance(perf);
            setTopProducts(perf.slice(0, 5));

            // BCG Matrix
            const avgRevenue = perf.reduce((sum, p) => sum + p.revenue, 0) / perf.length || 1;
            const avgQuantity = perf.reduce((sum, p) => sum + p.quantity, 0) / perf.length || 1;
            const bcg = perf.slice(0, 20).map(p => ({
                ...p,
                x: (p.quantity / avgQuantity) * 50,
                y: (p.revenue / avgRevenue) * 50,
                z: p.revenue
            }));
            setBcgData(bcg);

            // Helper function to get stock safely
            const getStock = (p) => parseFloat(p?.stockQuantity ?? p?.stock ?? p?.quantite ?? p?.quantity ?? 0);
            const getPrice = (p) => parseFloat(p?.price ?? p?.prix ?? p?.unitPrice ?? 0);

            // Low stock
            const lowStockProducts = prods.filter(p => getStock(p) <= 10).slice(0, 10).map(p => ({
                ...p,
                stockQuantity: getStock(p),
                price: getPrice(p)
            }));
            setLowStock(lowStockProducts);

            // Stock distribution
            const stockRanges = [
                { name: '0-10', count: prods.filter(p => getStock(p) <= 10).length },
                { name: '11-50', count: prods.filter(p => getStock(p) > 10 && getStock(p) <= 50).length },
                { name: '51-100', count: prods.filter(p => getStock(p) > 50 && getStock(p) <= 100).length },
                { name: '100+', count: prods.filter(p => getStock(p) > 100).length }
            ];
            setStockDistribution(stockRanges);

            // KPIs
            const totalProducts = prods.length;
            const lowStockCount = prods.filter(p => getStock(p) <= 10).length;
            const totalStockValue = prods.reduce((sum, p) => sum + (getPrice(p) * getStock(p)), 0);
            const avgPerf = perf.length > 0 ? perf.reduce((sum, p) => sum + p.revenue, 0) / perf.length : 0;

            setKpis({
                totalProducts,
                lowStockCount,
                totalStockValue,
                avgPerformance: avgPerf
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
                        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 animate-spin">
                            <div className="absolute inset-2 bg-white rounded-full"></div>
                        </div>
                        <Package className="absolute inset-0 m-auto w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-gray-700 font-semibold">Analyse des Produits...</p>
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
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/25">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Analyse des Produits</h1>
                    </div>
                    <p className="text-gray-500 mt-1 ml-12">Performance et gestion des stocks</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total Produits" value={formatNumber(kpis.totalProducts)} icon={Package} color="blue" />
                <KPICard title="Stock Bas" value={formatNumber(kpis.lowStockCount)} icon={AlertTriangle} color="red" alert />
                <KPICard title="Valeur Stock" value={formatCurrency(kpis.totalStockValue)} icon={BarChart3} color="green" />
                <KPICard title="Revenu Moyen/Produit" value={formatCurrency(kpis.avgPerformance)} icon={Star} color="purple" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Produits par Revenu</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={productPerformance.slice(0, 10)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* BCG Matrix */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Matrice BCG</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" dataKey="x" name="Part de Marché" domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <YAxis type="number" dataKey="y" name="Croissance" domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <ZAxis type="number" dataKey="z" range={[50, 500]} />
                            <Tooltip formatter={(v, n) => n === 'z' ? formatCurrency(v) : v.toFixed(1)} />
                            <ReferenceLine x={50} stroke="#9ca3af" strokeDasharray="3 3" />
                            <ReferenceLine y={50} stroke="#9ca3af" strokeDasharray="3 3" />
                            <Scatter name="Produits" data={bcgData} fill="#6366f1" />
                        </ScatterChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-4 gap-2 mt-4 text-xs text-center text-gray-500">
                        <div className="p-2 bg-yellow-50 rounded">⭐ Stars</div>
                        <div className="p-2 bg-red-50 rounded">❓ ?</div>
                        <div className="p-2 bg-green-50 rounded">🐄 Vaches</div>
                        <div className="p-2 bg-gray-50 rounded">🐕 Poids Mort</div>
                    </div>
                </div>
            </div>

            {/* Bottom section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stock Distribution */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution Stock</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={stockDistribution}
                                dataKey="count"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                            >
                                {stockDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Low Stock Alert */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Alertes Stock Bas
                    </h3>
                    <div className="overflow-auto max-h-64">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="text-left py-2 px-3 font-medium text-gray-600">Produit</th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-600">Stock</th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-600">Prix</th>
                                    <th className="text-center py-2 px-3 font-medium text-gray-600">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {lowStock.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="py-2 px-3 font-medium text-gray-900">{product.name}</td>
                                        <td className="py-2 px-3 text-right">
                                            <span className={product.stockQuantity <= 5 ? 'text-red-600 font-bold' : 'text-amber-600'}>
                                                {product.stockQuantity}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-right text-gray-600">{formatCurrency(product.price)}</td>
                                        <td className="py-2 px-3 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${product.stockQuantity <= 5
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {product.stockQuantity <= 5 ? 'Critique' : 'Bas'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {lowStock.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-500">
                                            Aucune alerte de stock
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon: Icon, color, alert }) {
    const colorClasses = {
        blue: 'from-blue-500 to-cyan-500',
        red: 'from-red-500 to-rose-500',
        green: 'from-green-500 to-emerald-500',
        purple: 'from-purple-500 to-violet-500'
    };

    return (
        <div className={`bg-white rounded-2xl border p-4 hover:shadow-lg transition-all ${alert ? 'border-red-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white`}>
                    <Icon className="w-5 h-5" />
                </div>
                {alert && <span className="animate-pulse w-2 h-2 rounded-full bg-red-500"></span>}
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{title}</div>
        </div>
    );
}
