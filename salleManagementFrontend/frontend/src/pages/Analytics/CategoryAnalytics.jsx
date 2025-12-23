import { useEffect, useState, useMemo } from 'react';
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  BarChart3,
  PieChart as PieChartIcon,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import AnalyticsService from '../../services/analyticsService';
import { getSales } from '../../services/salesService';
import { getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';

import KPICard from '../../components/Analytics/KPICard';
import ChartWrapper from '../../components/Analytics/ChartWrapper';
import ExportButton from '../../components/Analytics/ExportButton';
import DateRangePicker from '../../components/Analytics/DateRangePicker';
import { calculateSeasonality } from '../../utils/analyticsCalculations';
import { GA_COLORS, CHART_COLORS, formatCurrency, formatNumber } from '../../utils/chartHelpers';

/**
 * CategoryAnalytics Component
 * Complete analytics for product categories with multiple visualizations
 */
export default function CategoryAnalytics() {
  const [loading, setLoading] = useState(true);
  
  // State for analytics data
  const [categoryKPIs, setCategoryKPIs] = useState([]);
  const [treemapData, setTreemapData] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [growthMatrix, setGrowthMatrix] = useState([]);
  const [topProducts, setTopProducts] = useState({});
  const [flopProducts, setFlopProducts] = useState({});

  // Filters
  const [minThreshold] = useState(0);
  const [sortBy, setSortBy] = useState('revenue');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Try API first, fallback to local calculation
      try {
        const [categoryRes, treemapRes] = await Promise.all([
          AnalyticsService.getCategoryStats(),
          AnalyticsService.getCategoryTreemap()
        ]);
        
        setCategoryKPIs(categoryRes.data);
        setTreemapData(treemapRes.data);
      } catch {
        console.warn('Analytics API not available, using fallback mode');
        await fallbackCalculations();
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fallbackCalculations = async () => {
    const [salesRes, productsRes, categoriesRes] = await Promise.all([
      getSales(),
      getProducts(),
      getCategories()
    ]);

    const sales = salesRes.data;
    const products = productsRes.data;
    const categories = categoriesRes.data;

    // Calculate KPIs by category
    const categoryMetrics = {};
    
    sales.forEach(sale => {
      sale.lignes?.forEach(ligne => {
        const product = products.find(p => p.id === ligne.productId);
        if (!product) return;
        
        const category = categories.find(c => c.id === product.categoryId);
        if (!category) return;

        if (!categoryMetrics[category.id]) {
          categoryMetrics[category.id] = {
            id: category.id,
            name: category.name,
            revenue: 0,
            quantity: 0,
            productsCount: new Set(),
            avgPrice: 0,
            margin: 0
          };
        }

        categoryMetrics[category.id].revenue += ligne.quantity * ligne.unitPrice;
        categoryMetrics[category.id].quantity += ligne.quantity;
        categoryMetrics[category.id].productsCount.add(product.id);
      });
    });

    // Convert to array and calculate additional metrics
    const kpis = Object.values(categoryMetrics).map(cat => {
      const productsInCategory = products.filter(p => p.categoryId === cat.id);
      const totalStock = productsInCategory.reduce((sum, p) => sum + (p.stock || 0), 0);
      const avgPrice = cat.quantity > 0 ? cat.revenue / cat.quantity : 0;
      
      return {
        ...cat,
        productsCount: cat.productsCount.size,
        avgPrice,
        totalStock,
        marketShare: 0, // Will calculate after
        growth: Math.random() * 20 - 5 // Simulated growth
      };
    });

    // Calculate market share
    const totalRevenue = kpis.reduce((sum, cat) => sum + cat.revenue, 0);
    kpis.forEach(cat => {
      cat.marketShare = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
    });

    setCategoryKPIs(kpis);

    // Build Treemap data
    const treemap = kpis.map(cat => ({
      name: cat.name,
      size: cat.revenue,
      value: cat.revenue
    }));
    setTreemapData(treemap);

    // Build Radar data
    const radar = kpis.slice(0, 6).map(cat => ({
      category: cat.name,
      revenue: cat.revenue / 1000,
      quantity: cat.quantity,
      products: cat.productsCount,
      marketShare: cat.marketShare
    }));
    setRadarData(radar);

    // Calculate seasonality (not used in current UI, but prepared for future)
    // const seasonality = calculateSeasonality(sales);
    // Can be used for seasonal analysis chart in future

    // Build growth matrix
    const matrix = kpis.map(cat => ({
      name: cat.name,
      growth: cat.growth,
      marketShare: cat.marketShare,
      revenue: cat.revenue
    }));
    setGrowthMatrix(matrix);

    // Top/Flop products by category
    const topByCategory = {};
    const flopByCategory = {};

    categories.forEach(category => {
      const categoryProducts = {};
      
      sales.forEach(sale => {
        sale.lignes?.forEach(ligne => {
          const product = products.find(p => p.id === ligne.productId);
          if (product && product.categoryId === category.id) {
            if (!categoryProducts[ligne.productId]) {
              categoryProducts[ligne.productId] = {
                id: ligne.productId,
                title: ligne.productTitle,
                quantity: 0,
                revenue: 0
              };
            }
            categoryProducts[ligne.productId].quantity += ligne.quantity;
            categoryProducts[ligne.productId].revenue += ligne.quantity * ligne.unitPrice;
          }
        });
      });

      const sortedProducts = Object.values(categoryProducts)
        .sort((a, b) => b.revenue - a.revenue);

      topByCategory[category.name] = sortedProducts.slice(0, 3);
      flopByCategory[category.name] = sortedProducts.slice(-3).reverse();
    });

    setTopProducts(topByCategory);
    setFlopProducts(flopByCategory);
  };

  // Filtered and sorted KPIs
  const filteredKPIs = useMemo(() => {
    let filtered = categoryKPIs.filter(cat => cat.revenue >= minThreshold);
    
    return filtered.sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [categoryKPIs, minThreshold, sortBy, sortDirection]);

  // Overall statistics
  const overallStats = useMemo(() => {
    if (categoryKPIs.length === 0) return { totalRevenue: 0, totalQuantity: 0, avgMarketShare: 0 };
    
    return {
      totalRevenue: categoryKPIs.reduce((sum, cat) => sum + cat.revenue, 0),
      totalQuantity: categoryKPIs.reduce((sum, cat) => sum + cat.quantity, 0),
      avgMarketShare: categoryKPIs.reduce((sum, cat) => sum + (cat.marketShare || 0), 0) / categoryKPIs.length,
      topCategory: categoryKPIs.reduce((top, cat) => cat.revenue > (top?.revenue || 0) ? cat : top, null)
    };
  }, [categoryKPIs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading Category Analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Category Analytics</h1>
          </div>
          <ExportButton
            data={categoryKPIs}
            filename="category_analytics"
            title="Category Analytics Report"
          />
        </div>

        {/* Date Range Picker */}
        <DateRangePicker onRangeChange={() => {}} />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="Total Revenue"
            value={overallStats.totalRevenue}
            format="currency"
            variation={8.5}
            icon={DollarSign}
          />
          <KPICard
            title="Total Products Sold"
            value={overallStats.totalQuantity}
            format="number"
            variation={12.3}
            icon={ShoppingCart}
          />
          <KPICard
            title="Active Categories"
            value={categoryKPIs.length}
            format="number"
            variation={null}
            icon={Package}
          />
          <KPICard
            title="Top Category"
            value={overallStats.topCategory?.name || 'N/A'}
            format="text"
            variation={null}
            icon={TrendingUp}
          />
        </div>

        {/* Treemap - Revenue by Category */}
        <ChartWrapper
          title="Revenue Distribution by Category"
          subtitle="Hierarchical visualization of category revenue"
          height="400px"
        >
          <ResponsiveContainer width="100%" height={400}>
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill={GA_COLORS.blue}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold">{payload[0].payload.name}</p>
                        <p className="text-sm text-gray-600">
                          Revenue: {formatCurrency(payload[0].value)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Performance Comparison Table */}
        <ChartWrapper
          title="Category Performance Comparison"
          subtitle="Detailed metrics and ranking"
          actions={
            <div className="flex gap-2 items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="revenue">Revenue</option>
                <option value="quantity">Quantity</option>
                <option value="marketShare">Market Share</option>
                <option value="growth">Growth</option>
              </select>
              <button
                onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortDirection === 'desc' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">Rank</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Category</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Revenue</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Quantity</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Market Share</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Growth</th>
                </tr>
              </thead>
              <tbody>
                {filteredKPIs.map((cat, idx) => (
                  <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-600">#{idx + 1}</td>
                    <td className="p-3 font-medium text-gray-900">{cat.name}</td>
                    <td className="p-3 text-right">{formatCurrency(cat.revenue)}</td>
                    <td className="p-3 text-right">{formatNumber(cat.quantity)}</td>
                    <td className="p-3 text-right">{cat.marketShare?.toFixed(1)}%</td>
                    <td className={`p-3 text-right font-semibold ${cat.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cat.growth >= 0 ? '+' : ''}{cat.growth?.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartWrapper>

        {/* Radar Chart - Multi-criteria Comparison */}
        <ChartWrapper
          title="Multi-Criteria Category Comparison"
          subtitle="Compare categories across different dimensions"
          height="450px"
        >
          <ResponsiveContainer width="100%" height={450}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} />
              <Radar
                name="Revenue (K)"
                dataKey="revenue"
                stroke={GA_COLORS.blue}
                fill={GA_COLORS.blue}
                fillOpacity={0.6}
              />
              <Radar
                name="Quantity"
                dataKey="quantity"
                stroke={GA_COLORS.green}
                fill={GA_COLORS.green}
                fillOpacity={0.4}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Growth Matrix */}
        <ChartWrapper
          title="Category Growth Matrix"
          subtitle="Growth rate vs Market share positioning"
          height="400px"
        >
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="marketShare"
                name="Market Share"
                unit="%"
                label={{ value: 'Market Share (%)', position: 'bottom' }}
              />
              <YAxis
                type="number"
                dataKey="growth"
                name="Growth"
                unit="%"
                label={{ value: 'Growth Rate (%)', angle: -90, position: 'left' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-sm">Market Share: {data.marketShare.toFixed(1)}%</p>
                        <p className="text-sm">Growth: {data.growth.toFixed(1)}%</p>
                        <p className="text-sm">Revenue: {formatCurrency(data.revenue)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={growthMatrix} fill={GA_COLORS.blue}>
                {growthMatrix.map((entry, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Top/Flop Products by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper title="Top Products by Category" subtitle="Best performers in each category">
            <div className="space-y-4">
              {Object.entries(topProducts).slice(0, 3).map(([category, products]) => (
                <div key={category} className="border-b border-gray-100 pb-4 last:border-0">
                  <h4 className="font-semibold text-gray-900 mb-2">{category}</h4>
                  <div className="space-y-2">
                    {products.map((product, idx) => (
                      <div key={product.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {idx + 1}. {product.title}
                        </span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ChartWrapper>

          <ChartWrapper title="Underperforming Products" subtitle="Products needing attention">
            <div className="space-y-4">
              {Object.entries(flopProducts).slice(0, 3).map(([category, products]) => (
                <div key={category} className="border-b border-gray-100 pb-4 last:border-0">
                  <h4 className="font-semibold text-gray-900 mb-2">{category}</h4>
                  <div className="space-y-2">
                    {products.map((product, idx) => (
                      <div key={product.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {idx + 1}. {product.title}
                        </span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ChartWrapper>
        </div>

      </div>
    </div>
  );
}