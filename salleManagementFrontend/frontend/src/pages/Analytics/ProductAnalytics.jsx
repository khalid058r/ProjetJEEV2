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
  Clock
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

// UTILITIES
import { buildBCGMatrix } from "../../utils/analyticsCalculations";
import { GA_COLORS, CHART_COLORS, formatCurrency, getBCGColor } from "../../utils/chartHelpers";

/* ===============================================================
   MAIN COMPONENT — PRODUCT ANALYTICS DASHBOARD
================================================================*/
export default function ProductAnalytics() {
  const [kpi, setKpi] = useState(null);
  const [daily, setDaily] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [bestProducts, setBestProducts] = useState([]);
  const [productMatrix, setProductMatrix] = useState([]);
  const [bcgData, setBcgData] = useState({ stars: [], cashCows: [], questionMarks: [], dogs: [] });
  const [recommendations, setRecommendations] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  /* ===============================================================
      LOAD ANALYTICS FIRST (FALLBACK TO RAW SALES IF NEEDED)
  ================================================================*/
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
    } catch (e) {
      console.warn("Analytics API incomplete — fallback mode", e);
      await fallbackLoad();
    } finally {
      setLoading(false);
    }
  };

  /* ===============================================================
      FALLBACK MODE (CALCULATE EVERYTHING LOCALLY)
  ================================================================*/
  const fallbackLoad = async () => {
    const [salesRes, prodRes, catRes] = await Promise.all([
      getSales(),
      getProducts(),
      getCategories(),
    ]);

    const sales = salesRes.data;
    const products = prodRes.data;
    const categories = catRes.data;

    const totalRevenue = sales.reduce((s, v) => s + v.totalAmount, 0);
    const avgOrder = sales.length ? totalRevenue / sales.length : 0;

    setKpi({
      totalRevenue,
      totalSales: sales.length,
      averageBasket: avgOrder,
      lowStockCount: products.filter((p) => p.stock < 5).length,
    });

    const dailyMap = {};
    sales.forEach((s) => {
      const d = s.saleDate.split("T")[0];
      dailyMap[d] = (dailyMap[d] || 0) + s.totalAmount;
    });
    setDaily(Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue })));

    const catMap = {};
    sales.forEach((s) =>
      s.lignes?.forEach((l) => {
        const p = products.find((x) => x.id === l.productId);
        if (!p) return;
        const c = categories.find((x) => x.id === p.categoryId);
        if (!c) return;
        catMap[c.name] = (catMap[c.name] || 0) + l.quantity * l.unitPrice;
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
      s.lignes?.forEach((l) => {
        productCount[l.productTitle] =
          (productCount[l.productTitle] || 0) + l.quantity;
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
  };

  /* ===============================================================
      PRODUCT PERFORMANCE MATRIX BUILDER
  ================================================================*/
  const buildProductMatrix = (sales, products) => {
    const map = {};

    sales.forEach((s) =>
      s.lignes?.forEach((l) => {
        if (!map[l.productId]) {
          const product = products.find(p => p.id === l.productId);
          map[l.productId] = {
            id: l.productId,
            title: l.productTitle,
            qty: 0,
            revenue: 0,
            price: l.unitPrice,
            stock: product?.stock || 0
          };
        }
        map[l.productId].qty += l.quantity;
        map[l.productId].revenue += l.quantity * l.unitPrice;
      })
    );

    setProductMatrix(Object.values(map));
  };

  /* ===============================================================
      BCG MATRIX ANALYSIS
  ================================================================*/
  const buildBCGAnalysis = (products, sales) => {
    const bcgResult = buildBCGMatrix(products, sales);
    setBcgData(bcgResult);
  };

  /* ===============================================================
      GENERATE RECOMMENDATIONS
  ================================================================*/
  const generateRecommendations = (products, sales) => {
    const recs = [];

    // Calculate product metrics
    const productMetrics = {};
    sales.forEach(sale => {
      sale.lignes?.forEach(ligne => {
        if (!productMetrics[ligne.productId]) {
          const product = products.find(p => p.id === ligne.productId);
          productMetrics[ligne.productId] = {
            id: ligne.productId,
            title: ligne.productTitle,
            quantity: 0,
            revenue: 0,
            stock: product?.stock || 0,
            price: ligne.unitPrice
          };
        }
        productMetrics[ligne.productId].quantity += ligne.quantity;
        productMetrics[ligne.productId].revenue += ligne.quantity * ligne.unitPrice;
      });
    });

    // Low stock recommendations
    Object.values(productMetrics).forEach(product => {
      if (product.stock < 5 && product.quantity > 10) {
        recs.push({
          type: 'restock',
          priority: 'high',
          product: product.title,
          message: `Low stock (${product.stock} units). High demand. Restock immediately.`,
          icon: AlertCircle
        });
      }
    });

    // Slow movers - consider promotion
    const avgQuantity = Object.values(productMetrics).reduce((sum, p) => sum + p.quantity, 0) / Object.values(productMetrics).length;
    Object.values(productMetrics).forEach(product => {
      if (product.quantity < avgQuantity * 0.3 && product.stock > 20) {
        recs.push({
          type: 'promotion',
          priority: 'medium',
          product: product.title,
          message: `Slow mover with high stock. Consider promotion or discount.`,
          icon: TrendingDown
        });
      }
    });

    // Stars - maintain momentum
    const topProducts = Object.values(productMetrics)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    topProducts.forEach(product => {
      recs.push({
        type: 'maintain',
        priority: 'low',
        product: product.title,
        message: `Top performer. Ensure adequate stock and visibility.`,
        icon: Star
      });
    });

    setRecommendations(recs.slice(0, 10));
  };

  /* ===============================================================
      FILTERED PRODUCTS (SEARCH)
  ================================================================*/
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return productMatrix;
    
    return productMatrix.filter(product =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [productMatrix, searchTerm]);

  /* ===============================================================
      PRODUCT STATUS BADGE
  ================================================================*/
  const getProductBadge = (product) => {
    if (product.qty > 100) {
      return { label: 'Top Seller', color: 'bg-green-100 text-green-800', icon: Star };
    }
    if (product.stock < 5) {
      return { label: 'Low Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
    if (product.qty < 10) {
      return { label: 'Slow Mover', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
    return null;
  };

  /* ===============================================================
      LOADING UI
  ================================================================*/
  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading Product Analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );

  /* ===============================================================
      MAIN UI
  ================================================================*/
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Analytics</h1>
          </div>
          <ExportButton
            data={productMatrix}
            filename="product_analytics"
            title="Product Analytics Report"
          />
        </div>

        {/* DATE RANGE PICKER */}
        <DateRangePicker onRangeChange={() => {}} />

        {/* KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="Revenue"
            value={kpi.totalRevenue}
            format="currency"
            variation={12}
            icon={DollarSign}
          />
          <KPICard 
            title="Sales" 
            value={kpi.totalSales} 
            format="number"
            variation={6} 
            icon={ShoppingCart} 
          />
          <KPICard
            title="Avg Basket"
            value={kpi.averageBasket}
            format="currency"
            variation={-2}
            icon={BarChart2}
          />
          <KPICard 
            title="Low Stock" 
            value={kpi.lowStockCount} 
            format="number"
            variation={null} 
            icon={AlertTriangle} 
          />
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* BCG MATRIX */}
        <ChartWrapper
          title="BCG Matrix — Portfolio Analysis"
          subtitle="Product classification: Stars, Cash Cows, Question Marks, Dogs"
          height="500px"
        >
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Stars */}
            <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <Star className="text-green-600" size={20} />
                <h3 className="font-semibold text-green-900">Stars</h3>
                <span className="text-sm text-gray-600">High Growth, High Share</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {bcgData.stars.slice(0, 5).map((product, idx) => (
                  <div key={idx} className="bg-white p-2 rounded text-sm">
                    <div className="font-medium text-gray-900">{product.title}</div>
                    <div className="text-gray-600">{formatCurrency(product.revenue)}</div>
                  </div>
                ))}
                {bcgData.stars.length === 0 && (
                  <p className="text-gray-500 text-sm">No products in this category</p>
                )}
              </div>
            </div>

            {/* Question Marks */}
            <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="text-yellow-600" size={20} />
                <h3 className="font-semibold text-yellow-900">Question Marks</h3>
                <span className="text-sm text-gray-600">High Growth, Low Share</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {bcgData.questionMarks.slice(0, 5).map((product, idx) => (
                  <div key={idx} className="bg-white p-2 rounded text-sm">
                    <div className="font-medium text-gray-900">{product.title}</div>
                    <div className="text-gray-600">{formatCurrency(product.revenue)}</div>
                  </div>
                ))}
                {bcgData.questionMarks.length === 0 && (
                  <p className="text-gray-500 text-sm">No products in this category</p>
                )}
              </div>
            </div>

            {/* Cash Cows */}
            <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="text-blue-600" size={20} />
                <h3 className="font-semibold text-blue-900">Cash Cows</h3>
                <span className="text-sm text-gray-600">Low Growth, High Share</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {bcgData.cashCows.slice(0, 5).map((product, idx) => (
                  <div key={idx} className="bg-white p-2 rounded text-sm">
                    <div className="font-medium text-gray-900">{product.title}</div>
                    <div className="text-gray-600">{formatCurrency(product.revenue)}</div>
                  </div>
                ))}
                {bcgData.cashCows.length === 0 && (
                  <p className="text-gray-500 text-sm">No products in this category</p>
                )}
              </div>
            </div>

            {/* Dogs */}
            <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="text-red-600" size={20} />
                <h3 className="font-semibold text-red-900">Dogs</h3>
                <span className="text-sm text-gray-600">Low Growth, Low Share</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {bcgData.dogs.slice(0, 5).map((product, idx) => (
                  <div key={idx} className="bg-white p-2 rounded text-sm">
                    <div className="font-medium text-gray-900">{product.title}</div>
                    <div className="text-gray-600">{formatCurrency(product.revenue)}</div>
                  </div>
                ))}
                {bcgData.dogs.length === 0 && (
                  <p className="text-gray-500 text-sm">No products in this category</p>
                )}
              </div>
            </div>
          </div>
        </ChartWrapper>

        {/* RECOMMENDATIONS */}
        {recommendations.length > 0 && (
          <ChartWrapper
            title="Smart Recommendations"
            subtitle="Actionable insights for product management"
          >
            <div className="space-y-3">
              {recommendations.map((rec, idx) => {
                const Icon = rec.icon;
                const colorMap = {
                  high: 'bg-red-50 border-red-200 text-red-900',
                  medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
                  low: 'bg-blue-50 border-blue-200 text-blue-900'
                };
                return (
                  <div key={idx} className={`border-l-4 p-4 rounded ${colorMap[rec.priority]}`}>
                    <div className="flex items-start gap-3">
                      <Icon size={20} className="mt-0.5" />
                      <div>
                        <p className="font-semibold">{rec.product}</p>
                        <p className="text-sm mt-1">{rec.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartWrapper>
        )}

        {/* DAILY TREND */}
        <ChartWrapper
          title="Daily Revenue Trend"
          subtitle="Product sales performance over time"
          height="320px"
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GA_COLORS.blue} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={GA_COLORS.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                dataKey="revenue" 
                stroke={GA_COLORS.blue} 
                fill="url(#colorRevenue)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* CATEGORY PIE */}
        <ChartWrapper
          title="Category Contribution"
          subtitle="Revenue distribution by category"
          height="350px"
        >
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie 
                data={categoryStats} 
                dataKey="totalRevenue" 
                nameKey="categoryName" 
                outerRadius={120}
                label={({ categoryName, percent }) => `${categoryName}: ${(percent * 100).toFixed(0)}%`}
              >
                {categoryStats.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* BEST PRODUCTS */}
        <ChartWrapper
          title="Top Performing Products"
          subtitle="Best sellers by quantity"
          height="320px"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={bestProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="productTitle" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="totalQuantity" fill={GA_COLORS.blue} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* PRODUCT PERFORMANCE MATRIX */}
        <ChartWrapper
          title="Product Performance Matrix"
          subtitle="Sales velocity, revenue, and positioning (bubble size = price)"
          height="400px"
        >
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                dataKey="qty" 
                name="Quantity Sold"
                label={{ value: 'Quantity Sold', position: 'bottom', offset: 0 }}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                type="number" 
                dataKey="revenue" 
                name="Revenue"
                label={{ value: 'Revenue (DH)', angle: -90, position: 'left' }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    const badge = getProductBadge(data);
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900">{data.title}</p>
                        <p className="text-sm text-gray-600">Quantity: {data.qty}</p>
                        <p className="text-sm text-gray-600">Revenue: {formatCurrency(data.revenue)}</p>
                        <p className="text-sm text-gray-600">Price: {formatCurrency(data.price)}</p>
                        <p className="text-sm text-gray-600">Stock: {data.stock}</p>
                        {badge && (
                          <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${badge.color}`}>
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
              <Scatter
                data={filteredProducts}
                fill={GA_COLORS.blue}
                shape="circle"
              >
                {filteredProducts.map((entry, index) => {
                  const badge = getProductBadge(entry);
                  let color = GA_COLORS.blue;
                  if (badge) {
                    if (badge.label === 'Top Seller') color = GA_COLORS.green;
                    if (badge.label === 'Low Stock') color = GA_COLORS.red;
                    if (badge.label === 'Slow Mover') color = GA_COLORS.yellow;
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

        {/* PRODUCT CARDS WITH STATUS BADGES */}
        <ChartWrapper
          title="Product Catalog"
          subtitle={`Showing ${filteredProducts.length} products${searchTerm ? ` matching "${searchTerm}"` : ''}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredProducts.slice(0, 12).map((product, idx) => {
              const badge = getProductBadge(product);
              const BadgeIcon = badge?.icon;
              
              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{product.title}</h4>
                    {badge && BadgeIcon && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${badge.color}`}>
                        <BadgeIcon size={12} />
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Sold:</span>
                      <span className="font-medium">{product.qty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-medium text-green-600">{formatCurrency(product.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">{formatCurrency(product.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stock:</span>
                      <span className={`font-medium ${product.stock < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredProducts.length > 12 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Showing 12 of {filteredProducts.length} products
            </div>
          )}
        </ChartWrapper>

      </div>
    </div>
  );
}
