import { useEffect, useState, useMemo } from "react";
import {
    DollarSign,
    ShoppingCart,
    AlertTriangle,
    BarChart2,
    TrendingUp,
    TrendingDown,
    Search,
    Star,
    Package,
    AlertCircle,
    Clock,
    Layers,
    Eye,
    Target,
    Award,
    Zap,
    Box
} from "lucide-react";

import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    ScatterChart,
    Scatter,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend,
    ComposedChart,
    Line,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from "recharts";

import AnalyticsService from "../../services/analyticsService";
import { getSales } from "../../services/salesService";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";

// COMPONENTS
import KPICard from "../../components/Analytics/KPICard";
import ChartWrapper from "../../components/Analytics/ChartWrapper";
import ExportButton from "../../components/Analytics/ExportButton";
import DateRangePicker from "../../components/Analytics/DateRangePicker";
import InsightCard, { InsightsContainer } from "../../components/Analytics/InsightCard";
import StatisticsGrid from "../../components/Analytics/StatisticsGrid";
import DataTable from "../../components/Analytics/DataTable";
import ProgressRing from "../../components/Analytics/ProgressRing";

// UTILITIES
import { buildBCGMatrix } from "../../utils/analyticsCalculations";
import { GA_COLORS, CHART_COLORS, formatCurrency, formatNumber, getBCGColor } from "../../utils/chartHelpers";

/**
 * Enhanced ProductAnalytics Component
 * Comprehensive product portfolio analysis with BCG matrix and recommendations
 */
export default function ProductAnalytics() {
    const [kpi, setKpi] = useState(null);
    const [daily, setDaily] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [bestProducts, setBestProducts] = useState([]);
    const [productMatrix, setProductMatrix] = useState([]);
    const [bcgData, setBcgData] = useState({ stars: [], cashCows: [], questionMarks: [], dogs: [] });
    const [recommendations, setRecommendations] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [productMetrics, setProductMetrics] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const [
                kpiRes,
                dailyRes,
                catRes,
                bestRes,
                salesRes,
                prodRes,
            ] = await Promise.all([
                AnalyticsService.getGlobalKpi(),
                AnalyticsService.getDailySales(),
                AnalyticsService.getCategoryStats(),
                AnalyticsService.getBestSellers(5),
                getSales(),
                getProducts(),
            ]);

            setKpi(kpiRes.data);
            setDaily(dailyRes.data);
            setCategoryStats(catRes.data);
            setBestProducts(bestRes.data);
            setAllProducts(prodRes.data);

            buildProductMatrix(salesRes.data, prodRes.data);
            buildBCGAnalysis(prodRes.data, salesRes.data);
            generateRecommendations(prodRes.data, salesRes.data);
            buildProductMetrics(prodRes.data, salesRes.data);
        } catch (e) {
            console.warn("Analytics API incomplete — mode de secours", e);
            await fallbackLoad();
        } finally {
            setLoading(false);
        }
    };

    const fallbackLoad = async () => {
        const [salesRes, prodRes, catRes] = await Promise.all([
            getSales().catch(err => { console.error("Sales error:", err); return { data: [] }; }),
            getProducts().catch(err => { console.error("Products error:", err); return { data: [] }; }),
            getCategories().catch(err => { console.error("Categories error:", err); return { data: [] }; }),
        ]);

        // Ensure arrays with proper fallbacks
        const sales = Array.isArray(salesRes?.data) ? salesRes.data : (Array.isArray(salesRes) ? salesRes : []);
        const products = Array.isArray(prodRes?.data) ? prodRes.data : (Array.isArray(prodRes) ? prodRes : []);
        const categories = Array.isArray(catRes?.data) ? catRes.data : (Array.isArray(catRes) ? catRes : []);

        console.log("ProductAnalytics fallback loaded:", { salesCount: sales.length, productsCount: products.length, categoriesCount: categories.length });

        // Safe accessor for sale amount
        const getSaleAmount = (s) => {
            const amount = parseFloat(s?.totalAmount ?? s?.total ?? s?.montant ?? 0);
            return isNaN(amount) ? 0 : amount;
        };

        // Safe accessor for sale lines
        const getSaleLines = (s) => s?.lignes || s?.lignesVente || s?.saleLines || s?.items || [];

        // Safe accessor for sale date
        const getSaleDate = (s) => {
            const dateStr = s?.saleDate || s?.createdAt || s?.date || s?.dateVente;
            try {
                return dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            } catch {
                return new Date().toISOString().split('T')[0];
            }
        };

        // Safe accessor for product stock
        const getStock = (p) => parseFloat(p?.stock ?? p?.stockQuantity ?? p?.quantity ?? 0);

        const totalRevenue = sales.reduce((s, v) => s + getSaleAmount(v), 0);
        const avgOrder = sales.length ? totalRevenue / sales.length : 0;
        const lowStockCount = products.filter((p) => getStock(p) < 5).length;

        setKpi({
            totalRevenue,
            totalSales: sales.length,
            averageBasket: avgOrder,
            lowStockCount,
            totalProducts: products.length,
            activeProducts: products.filter(p => getStock(p) > 0).length
        });

        const dailyMap = {};
        sales.forEach((s) => {
            const d = getSaleDate(s);
            dailyMap[d] = (dailyMap[d] || 0) + getSaleAmount(s);
        });
        setDaily(Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue })));

        const catMap = {};
        sales.forEach((s) =>
            getSaleLines(s).forEach((l) => {
                const pid = l?.productId || l?.product?.id;
                const p = products.find((x) => x.id === pid);
                if (!p) return;
                const catId = p?.categoryId || p?.category?.id;
                const c = categories.find((x) => x.id === catId);
                if (!c) return;
                const catName = c?.name || c?.nom || c?.title || 'Autre';
                const qty = parseFloat(l?.quantity || l?.quantite || 0);
                const price = parseFloat(l?.unitPrice || l?.prixUnitaire || 0);
                catMap[catName] = (catMap[catName] || 0) + qty * price;
            })
        );
        setCategoryStats(
            Object.entries(catMap).map(([categoryName, totalRevenue]) => ({
                categoryName,
                totalRevenue,
            }))
        );

        const productCount = {};
        sales.forEach((s) =>
            getSaleLines(s).forEach((l) => {
                const title = l?.productTitle || l?.product?.title || l?.product?.name || 'Produit';
                const qty = parseFloat(l?.quantity || l?.quantite || 0);
                productCount[title] = (productCount[title] || 0) + qty;
            })
        );
        setBestProducts(
            Object.entries(productCount)
                .map(([productTitle, totalQuantity]) => ({ productTitle, totalQuantity }))
                .sort((a, b) => b.totalQuantity - a.totalQuantity)
                .slice(0, 5)
        );

        setAllProducts(products);
        buildProductMatrix(sales, products);
        buildBCGAnalysis(products, sales);
        generateRecommendations(products, sales);
        buildProductMetrics(products, sales);
    };

    const buildProductMatrix = (sales, products) => {
        const map = {};

        // Safe accessor for sale lines
        const getSaleLines = (s) => s?.lignes || s?.lignesVente || s?.saleLines || s?.items || [];

        // Safe accessor for product stock
        const getStock = (p) => parseFloat(p?.stock ?? p?.stockQuantity ?? p?.quantity ?? 0);

        sales.forEach((s) =>
            getSaleLines(s).forEach((l) => {
                const pid = l?.productId || l?.product?.id;
                if (!pid) return;

                if (!map[pid]) {
                    const product = products.find(p => p.id === pid);
                    map[pid] = {
                        id: pid,
                        title: l?.productTitle || l?.product?.title || product?.title || product?.name || `Produit ${pid}`,
                        qty: 0,
                        revenue: 0,
                        price: parseFloat(l?.unitPrice || l?.prixUnitaire || 0),
                        stock: product ? getStock(product) : 0
                    };
                }
                const qty = parseFloat(l?.quantity || l?.quantite || 0);
                const price = parseFloat(l?.unitPrice || l?.prixUnitaire || 0);
                map[pid].qty += qty;
                map[pid].revenue += qty * price;
            })
        );

        setProductMatrix(Object.values(map));
    };

    const buildBCGAnalysis = (products, sales) => {
        const bcgResult = buildBCGMatrix(products, sales);
        setBcgData(bcgResult);
    };

    const buildProductMetrics = (products, sales) => {
        // Safe accessor for sale amount
        const getSaleAmount = (s) => {
            const amount = parseFloat(s?.totalAmount ?? s?.total ?? s?.montant ?? 0);
            return isNaN(amount) ? 0 : amount;
        };

        // Safe accessor for sale lines
        const getSaleLines = (s) => s?.lignes || s?.lignesVente || s?.saleLines || s?.items || [];

        const totalQtySold = sales.reduce((sum, s) =>
            sum + (getSaleLines(s).reduce((lSum, l) => lSum + (parseFloat(l?.quantity || l?.quantite || 0)), 0)), 0
        );
        const totalRevenue = sales.reduce((sum, s) => sum + getSaleAmount(s), 0);
        const avgStockLevel = products.length > 0
            ? products.reduce((sum, p) => sum + parseFloat(p?.stock ?? p?.stockQuantity ?? p?.quantity ?? 0), 0) / products.length
            : 0;

        setProductMetrics([
            { type: 'revenue', value: totalRevenue, label: 'Revenu Produits', format: 'currency', change: 15.2 },
            { type: 'sales', value: totalQtySold, label: 'Unités Vendues', format: 'number', change: 8.5 },
            { type: 'average', value: avgStockLevel, label: 'Stock Moyen', format: 'number' },
            { type: 'target', value: products.length, label: 'Total Produits', format: 'number' },
        ]);
    };

    const generateRecommendations = (products, sales) => {
        const recs = [];

        // Safe accessor for sale lines
        const getSaleLines = (s) => s?.lignes || s?.lignesVente || s?.saleLines || s?.items || [];

        // Safe accessor for product stock
        const getStock = (p) => parseFloat(p?.stock ?? p?.stockQuantity ?? p?.quantity ?? 0);

        const productStats = {};
        sales.forEach(sale => {
            getSaleLines(sale).forEach(ligne => {
                const pid = ligne?.productId || ligne?.product?.id;
                if (!pid) return;

                if (!productStats[pid]) {
                    const product = products.find(p => p.id === pid);
                    productStats[pid] = {
                        id: pid,
                        title: ligne?.productTitle || ligne?.product?.title || product?.title || product?.name || `Produit ${pid}`,
                        quantity: 0,
                        revenue: 0,
                        stock: product ? getStock(product) : 0,
                        price: parseFloat(ligne?.unitPrice || ligne?.prixUnitaire || 0)
                    };
                }
                const qty = parseFloat(ligne?.quantity || ligne?.quantite || 0);
                const price = parseFloat(ligne?.unitPrice || ligne?.prixUnitaire || 0);
                productStats[pid].quantity += qty;
                productStats[pid].revenue += qty * price;
            });
        });

        // Recommandations de stock critique
        Object.values(productStats).forEach(product => {
            if (product.stock < 5 && product.quantity > 10) {
                recs.push({
                    type: 'restock',
                    priority: 'high',
                    product: product.title,
                    message: `Stock critique (${product.stock} unités). Forte demande. Réapprovisionner immédiatement.`,
                    icon: AlertCircle
                });
            }
        });

        // Produits à faible rotation
        const avgQuantity = Object.values(productStats).reduce((sum, p) => sum + p.quantity, 0) / Object.values(productStats).length;
        Object.values(productStats).forEach(product => {
            if (product.quantity < avgQuantity * 0.3 && product.stock > 20) {
                recs.push({
                    type: 'promotion',
                    priority: 'medium',
                    product: product.title,
                    message: `Rotation lente avec stock élevé. Considérer une promotion ou remise.`,
                    icon: TrendingDown
                });
            }
        });

        // Produits stars
        const topProducts = Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 3);

        topProducts.forEach(product => {
            recs.push({
                type: 'maintain',
                priority: 'low',
                product: product.title,
                message: `Meilleure performance. Maintenir le stock et la visibilité.`,
                icon: Star
            });
        });

        setRecommendations(recs.slice(0, 10));
    };

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return productMatrix;
        return productMatrix.filter(product =>
            product.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [productMatrix, searchTerm]);

    const getProductBadge = (product) => {
        if (product.qty > 100) {
            return { label: 'Top Vente', color: 'bg-green-100 text-green-800 border-green-200', icon: Star };
        }
        if (product.stock < 5) {
            return { label: 'Stock Bas', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle };
        }
        if (product.qty < 10) {
            return { label: 'Rotation Lente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
        }
        return null;
    };

    // Données radar pour l'analyse de portefeuille
    const portfolioRadarData = useMemo(() => {
        if (!bcgData) return [];
        return [
            { subject: 'Stars', value: bcgData.stars?.length || 0, fullMark: 10 },
            { subject: 'Vaches à Lait', value: bcgData.cashCows?.length || 0, fullMark: 10 },
            { subject: 'Dilemmes', value: bcgData.questionMarks?.length || 0, fullMark: 10 },
            { subject: 'Poids Morts', value: bcgData.dogs?.length || 0, fullMark: 10 },
        ];
    }, [bcgData]);

    // Progress rings data
    const progressRings = useMemo(() => {
        if (!kpi) return [];
        const stockHealth = kpi.totalProducts > 0
            ? ((kpi.totalProducts - kpi.lowStockCount) / kpi.totalProducts) * 100
            : 0;
        return [
            { value: kpi.totalRevenue, max: 200000, color: '#10b981', label: 'Objectif Revenu', sublabel: 'mensuel' },
            { value: stockHealth, max: 100, color: '#3b82f6', label: 'Santé Stock', sublabel: 'disponibilité' },
            { value: bcgData.stars?.length || 0, max: 20, color: '#f59e0b', label: 'Produits Stars', sublabel: 'portfolio' },
            { value: kpi.activeProducts || 0, max: kpi.totalProducts || 50, color: '#8b5cf6', label: 'Produits Actifs', sublabel: 'en vente' },
        ];
    }, [kpi, bcgData]);

    // Product table data
    const productTableData = useMemo(() => {
        return filteredProducts.slice(0, 20).map((product, idx) => ({
            rank: idx + 1,
            title: product.title,
            qty: product.qty,
            revenue: product.revenue,
            price: product.price,
            stock: product.stock,
            status: product.stock < 5 ? 'Critique' : product.qty > 100 ? 'Star' : 'Normal'
        }));
    }, [filteredProducts]);

    if (loading)
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="text-center">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"></div>
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 animate-spin">
                                        <div className="absolute inset-2 bg-white rounded-full"></div>
                                    </div>
                                    <Package className="absolute inset-0 m-auto w-8 h-8 text-purple-600" />
                                </div>
                            </div>
                            <p className="text-gray-700 font-semibold text-lg">Analyse des Produits...</p>
                            <p className="text-gray-500 text-sm mt-1">Calcul du portefeuille en cours</p>
                        </div>
                    </div>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                Analyse des Produits
                            </h1>
                        </div>
                        <p className="text-gray-500 ml-12">
                            Portefeuille produits, performances et recommandations
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <DateRangePicker onRangeChange={() => { }} />
                        <ExportButton
                            data={productMatrix}
                            filename="product_analytics"
                            title="Rapport Produits"
                        />
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <KPICard
                        title="Revenu Produits"
                        value={kpi?.totalRevenue || 0}
                        format="currency"
                        variation={15.2}
                        icon={DollarSign}
                        color="green"
                        size="compact"
                    />
                    <KPICard
                        title="Ventes Totales"
                        value={kpi?.totalSales || 0}
                        format="number"
                        variation={8.5}
                        icon={ShoppingCart}
                        color="blue"
                        size="compact"
                    />
                    <KPICard
                        title="Panier Moyen"
                        value={kpi?.averageBasket || 0}
                        format="currency"
                        variation={3.2}
                        icon={BarChart2}
                        color="purple"
                        size="compact"
                    />
                    <KPICard
                        title="Total Produits"
                        value={kpi?.totalProducts || allProducts.length}
                        format="number"
                        variation={null}
                        icon={Package}
                        color="indigo"
                        size="compact"
                    />
                    <KPICard
                        title="Stock Critique"
                        value={kpi?.lowStockCount || 0}
                        format="number"
                        variation={null}
                        icon={AlertTriangle}
                        color="red"
                        size="compact"
                    />
                    <KPICard
                        title="Produits Stars"
                        value={bcgData.stars?.length || 0}
                        format="number"
                        variation={null}
                        icon={Star}
                        color="orange"
                        size="compact"
                    />
                </div>

                {/* Statistics Grid */}
                {productMetrics.length > 0 && (
                    <StatisticsGrid stats={productMetrics} />
                )}

                {/* Smart Insights */}
                <InsightsContainer title="Insights Produits">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InsightCard
                            type="warning"
                            title="Alertes Stock"
                            message={`${kpi?.lowStockCount || 0} produits en stock critique. Réapprovisionnement nécessaire.`}
                        />
                        <InsightCard
                            type="success"
                            title="Produits Stars"
                            message={`${bcgData.stars?.length || 0} produits performent excellemment. Maintenez leur visibilité.`}
                        />
                        <InsightCard
                            type="insight"
                            title="Portfolio Équilibré"
                            message="Analysez la matrice BCG pour optimiser votre mix produits et maximiser le ROI."
                        />
                    </div>
                </InsightsContainer>

                {/* Progress Indicators */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        Indicateurs de Performance
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {progressRings.map((ring, index) => (
                            <ProgressRing key={index} {...ring} size={100} strokeWidth={8} />
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* BCG Matrix */}
                <ChartWrapper
                    title="Matrice BCG — Analyse du Portefeuille"
                    subtitle="Classification produits : Stars, Vaches à Lait, Dilemmes, Poids Morts"
                    icon={Layers}
                    height="500px"
                >
                    <div className="grid grid-cols-2 gap-4 h-full">
                        {/* Stars */}
                        <div className="border-2 border-green-200 rounded-xl p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-green-100 rounded-lg">
                                    <Star className="text-green-600" size={18} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-green-900">Stars</h3>
                                    <span className="text-xs text-gray-500">Croissance élevée, Part élevée</span>
                                </div>
                                <span className="ml-auto bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                    {bcgData.stars?.length || 0}
                                </span>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {bcgData.stars?.slice(0, 5).map((product, idx) => (
                                    <div key={idx} className="bg-white/80 p-3 rounded-lg border border-green-100 hover:shadow-sm transition-shadow">
                                        <div className="font-medium text-gray-900 text-sm">{product.title}</div>
                                        <div className="text-green-600 text-xs font-medium">{formatCurrency(product.revenue)}</div>
                                    </div>
                                ))}
                                {bcgData.stars?.length === 0 && (
                                    <p className="text-gray-500 text-sm italic">Aucun produit dans cette catégorie</p>
                                )}
                            </div>
                        </div>

                        {/* Question Marks */}
                        <div className="border-2 border-yellow-200 rounded-xl p-4 bg-gradient-to-br from-yellow-50 to-amber-50">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-yellow-100 rounded-lg">
                                    <AlertCircle className="text-yellow-600" size={18} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-yellow-900">Dilemmes</h3>
                                    <span className="text-xs text-gray-500">Croissance élevée, Part faible</span>
                                </div>
                                <span className="ml-auto bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                                    {bcgData.questionMarks?.length || 0}
                                </span>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {bcgData.questionMarks?.slice(0, 5).map((product, idx) => (
                                    <div key={idx} className="bg-white/80 p-3 rounded-lg border border-yellow-100 hover:shadow-sm transition-shadow">
                                        <div className="font-medium text-gray-900 text-sm">{product.title}</div>
                                        <div className="text-yellow-600 text-xs font-medium">{formatCurrency(product.revenue)}</div>
                                    </div>
                                ))}
                                {bcgData.questionMarks?.length === 0 && (
                                    <p className="text-gray-500 text-sm italic">Aucun produit dans cette catégorie</p>
                                )}
                            </div>
                        </div>

                        {/* Cash Cows */}
                        <div className="border-2 border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <DollarSign className="text-blue-600" size={18} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-blue-900">Vaches à Lait</h3>
                                    <span className="text-xs text-gray-500">Croissance faible, Part élevée</span>
                                </div>
                                <span className="ml-auto bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                    {bcgData.cashCows?.length || 0}
                                </span>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {bcgData.cashCows?.slice(0, 5).map((product, idx) => (
                                    <div key={idx} className="bg-white/80 p-3 rounded-lg border border-blue-100 hover:shadow-sm transition-shadow">
                                        <div className="font-medium text-gray-900 text-sm">{product.title}</div>
                                        <div className="text-blue-600 text-xs font-medium">{formatCurrency(product.revenue)}</div>
                                    </div>
                                ))}
                                {bcgData.cashCows?.length === 0 && (
                                    <p className="text-gray-500 text-sm italic">Aucun produit dans cette catégorie</p>
                                )}
                            </div>
                        </div>

                        {/* Dogs */}
                        <div className="border-2 border-red-200 rounded-xl p-4 bg-gradient-to-br from-red-50 to-rose-50">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-red-100 rounded-lg">
                                    <TrendingDown className="text-red-600" size={18} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-red-900">Poids Morts</h3>
                                    <span className="text-xs text-gray-500">Croissance faible, Part faible</span>
                                </div>
                                <span className="ml-auto bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                                    {bcgData.dogs?.length || 0}
                                </span>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {bcgData.dogs?.slice(0, 5).map((product, idx) => (
                                    <div key={idx} className="bg-white/80 p-3 rounded-lg border border-red-100 hover:shadow-sm transition-shadow">
                                        <div className="font-medium text-gray-900 text-sm">{product.title}</div>
                                        <div className="text-red-600 text-xs font-medium">{formatCurrency(product.revenue)}</div>
                                    </div>
                                ))}
                                {bcgData.dogs?.length === 0 && (
                                    <p className="text-gray-500 text-sm italic">Aucun produit dans cette catégorie</p>
                                )}
                            </div>
                        </div>
                    </div>
                </ChartWrapper>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Portfolio Radar */}
                    <ChartWrapper
                        title="Vue Radar du Portefeuille"
                        subtitle="Distribution des produits par catégorie BCG"
                        icon={Eye}
                        height="350px"
                    >
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart data={portfolioRadarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <PolarRadiusAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <Radar
                                    name="Produits"
                                    dataKey="value"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.4}
                                    strokeWidth={2}
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>

                    {/* Category Distribution */}
                    <ChartWrapper
                        title="Répartition par Catégorie"
                        subtitle="Contribution au chiffre d'affaires"
                        icon={Layers}
                        height="350px"
                    >
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={categoryStats}
                                    dataKey="totalRevenue"
                                    nameKey="categoryName"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    innerRadius={40}
                                    label={({ categoryName, percent }) => `${categoryName}: ${(percent * 100).toFixed(0)}%`}
                                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                                >
                                    {categoryStats.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <ChartWrapper
                        title="Recommandations Intelligentes"
                        subtitle="Actions suggérées pour optimiser le portefeuille"
                        icon={Zap}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendations.map((rec, idx) => {
                                const Icon = rec.icon;
                                const colorMap = {
                                    high: 'bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500',
                                    medium: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500',
                                    low: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500'
                                };
                                const iconColorMap = {
                                    high: 'text-red-600',
                                    medium: 'text-yellow-600',
                                    low: 'text-blue-600'
                                };
                                return (
                                    <div key={idx} className={`p-4 rounded-xl ${colorMap[rec.priority]} hover:shadow-md transition-shadow`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg bg-white/50 ${iconColorMap[rec.priority]}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{rec.product}</p>
                                                <p className="text-sm text-gray-600 mt-1">{rec.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ChartWrapper>
                )}

                {/* Daily Trend */}
                <ChartWrapper
                    title="Tendance des Ventes Quotidiennes"
                    subtitle="Performance des ventes produits dans le temps"
                    icon={TrendingUp}
                    height="350px"
                >
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={daily}>
                            <defs>
                                <linearGradient id="colorProductRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorProductRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Best Products Chart */}
                <ChartWrapper
                    title="Top Produits par Quantité"
                    subtitle="Meilleurs vendeurs en volume"
                    icon={Award}
                    height="320px"
                >
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={bestProducts} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <YAxis type="category" dataKey="productTitle" tick={{ fontSize: 11, fill: '#6b7280' }} width={150} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="totalQuantity" radius={[0, 8, 8, 0]}>
                                {bestProducts.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Product Performance Matrix */}
                <ChartWrapper
                    title="Matrice de Performance Produits"
                    subtitle="Vélocité des ventes vs revenu (taille = prix)"
                    icon={BarChart2}
                    height="400px"
                >
                    <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                type="number"
                                dataKey="qty"
                                name="Quantité"
                                label={{ value: 'Quantité Vendue', position: 'bottom', offset: 0, fill: '#6b7280' }}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                            />
                            <YAxis
                                type="number"
                                dataKey="revenue"
                                name="Revenu"
                                label={{ value: 'Revenu (DH)', angle: -90, position: 'left', fill: '#6b7280' }}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload[0]) {
                                        const data = payload[0].payload;
                                        const badge = getProductBadge(data);
                                        return (
                                            <div className="bg-white p-4 border-none rounded-xl shadow-lg">
                                                <p className="font-semibold text-gray-900">{data.title}</p>
                                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                                    <p>Quantité: <span className="font-medium text-gray-900">{data.qty}</span></p>
                                                    <p>Revenu: <span className="font-medium text-green-600">{formatCurrency(data.revenue)}</span></p>
                                                    <p>Prix: <span className="font-medium">{formatCurrency(data.price)}</span></p>
                                                    <p>Stock: <span className={`font-medium ${data.stock < 5 ? 'text-red-600' : 'text-gray-900'}`}>{data.stock}</span></p>
                                                </div>
                                                {badge && (
                                                    <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full border ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend />
                            <Scatter data={filteredProducts} fill="#8b5cf6" shape="circle">
                                {filteredProducts.map((entry, index) => {
                                    const badge = getProductBadge(entry);
                                    let color = '#8b5cf6';
                                    if (badge) {
                                        if (badge.label === 'Top Vente') color = '#10b981';
                                        if (badge.label === 'Stock Bas') color = '#ef4444';
                                        if (badge.label === 'Rotation Lente') color = '#f59e0b';
                                    }
                                    return (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={color}
                                            r={Math.max(4, Math.min(entry.price / 10, 12))}
                                        />
                                    );
                                })}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Product Table */}
                <DataTable
                    title="Catalogue Produits"
                    data={productTableData}
                    columns={[
                        { key: 'rank', label: '#', width: '50px', bold: true },
                        { key: 'title', label: 'Produit', bold: true },
                        { key: 'qty', label: 'Qté Vendue', align: 'center' },
                        { key: 'revenue', label: 'Revenu', format: 'currency', align: 'right' },
                        { key: 'price', label: 'Prix', format: 'currency', align: 'right' },
                        { key: 'stock', label: 'Stock', align: 'center' },
                        { key: 'status', label: 'Statut', align: 'center' }
                    ]}
                    searchable={true}
                    pageSize={10}
                />

                {/* Product Cards Grid */}
                <ChartWrapper
                    title="Aperçu des Produits"
                    subtitle={`${filteredProducts.length} produits${searchTerm ? ` correspondant à "${searchTerm}"` : ''}`}
                    icon={Box}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto">
                        {filteredProducts.slice(0, 16).map((product, idx) => {
                            const badge = getProductBadge(product);
                            const BadgeIcon = badge?.icon;

                            return (
                                <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{product.title}</h4>
                                        {badge && BadgeIcon && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${badge.color}`}>
                                                <BadgeIcon size={12} />
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Vendu:</span>
                                            <span className="font-semibold text-gray-900">{product.qty}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Revenu:</span>
                                            <span className="font-semibold text-green-600">{formatCurrency(product.revenue)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Prix:</span>
                                            <span className="font-medium text-gray-900">{formatCurrency(product.price)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Stock:</span>
                                            <span className={`font-semibold ${product.stock < 5 ? 'text-red-600' : product.stock < 10 ? 'text-yellow-600' : 'text-gray-900'}`}>
                                                {product.stock}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {filteredProducts.length > 16 && (
                        <div className="mt-4 text-center text-sm text-gray-500">
                            Affichage de 16 sur {filteredProducts.length} produits
                        </div>
                    )}
                </ChartWrapper>

            </div>
        </div>
    );
}
