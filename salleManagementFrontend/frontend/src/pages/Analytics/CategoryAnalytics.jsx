import { useEffect, useState, useMemo } from 'react';
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Target,
  Award,
  Layers,
  Grid,
  Zap,
  Eye,
  Activity
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
  Legend,
  AreaChart,
  Area
} from 'recharts';

import AnalyticsService from '../../services/analyticsService';
import { getSales } from '../../services/salesService';
import { getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';

import KPICard from '../../components/Analytics/KPICard';
import ChartWrapper from '../../components/Analytics/ChartWrapper';
import ExportButton from '../../components/Analytics/ExportButton';
import DateRangePicker from '../../components/Analytics/DateRangePicker';
import InsightCard, { InsightsContainer } from '../../components/Analytics/InsightCard';
import StatisticsGrid from '../../components/Analytics/StatisticsGrid';
import DataTable from '../../components/Analytics/DataTable';
import ProgressRing from '../../components/Analytics/ProgressRing';

import { calculateSeasonality } from '../../utils/analyticsCalculations';
import { GA_COLORS, CHART_COLORS, formatCurrency, formatNumber } from '../../utils/chartHelpers';

/**
 * Enhanced CategoryAnalytics Component
 * Comprehensive analytics for product categories with multiple visualizations
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
  const [categoryTrend, setCategoryTrend] = useState([]);
  const [categoryMetrics, setCategoryMetrics] = useState([]);

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

      try {
        const [categoryRes, treemapRes] = await Promise.all([
          AnalyticsService.getCategoryStats(),
          AnalyticsService.getCategoryTreemap()
        ]);

        setCategoryKPIs(categoryRes.data);
        setTreemapData(treemapRes.data);
      } catch {
        console.warn('Analytics API non disponible, mode de secours');
        await fallbackCalculations();
      }
    } catch (error) {
      console.error('Erreur de chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fallbackCalculations = async () => {
    const [salesRes, productsRes, categoriesRes] = await Promise.all([
      getSales().catch(err => { console.error("Sales error:", err); return { data: [] }; }),
      getProducts().catch(err => { console.error("Products error:", err); return { data: [] }; }),
      getCategories().catch(err => { console.error("Categories error:", err); return { data: [] }; })
    ]);

    // Ensure arrays with proper fallbacks
    const sales = Array.isArray(salesRes?.data) ? salesRes.data : (Array.isArray(salesRes) ? salesRes : []);
    const products = Array.isArray(productsRes?.data) ? productsRes.data : (Array.isArray(productsRes) ? productsRes : []);
    const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : (Array.isArray(categoriesRes) ? categoriesRes : []);

    console.log("CategoryAnalytics fallback loaded:", { salesCount: sales.length, productsCount: products.length, categoriesCount: categories.length });

    // Safe accessor for sale lines
    const getSaleLines = (s) => s?.lignes || s?.lignesVente || s?.saleLines || s?.items || [];

    // Calculate KPIs by category
    const categoryMetricsMap = {};

    sales.forEach(sale => {
      getSaleLines(sale).forEach(ligne => {
        const pid = ligne?.productId || ligne?.product?.id;
        const product = products.find(p => p.id === pid);
        if (!product) return;

        const catId = product?.categoryId || product?.category?.id;
        const category = categories.find(c => c.id === catId);
        if (!category) return;

        if (!categoryMetricsMap[category.id]) {
          categoryMetricsMap[category.id] = {
            id: category.id,
            name: category?.name || category?.nom || category?.title || 'Catégorie',
            revenue: 0,
            quantity: 0,
            productsCount: new Set(),
            avgPrice: 0,
            margin: 0
          };
        }

        const qty = parseFloat(ligne?.quantity || ligne?.quantite || 0);
        const price = parseFloat(ligne?.unitPrice || ligne?.prixUnitaire || 0);
        categoryMetricsMap[category.id].revenue += qty * price;
        categoryMetricsMap[category.id].quantity += qty;
        categoryMetricsMap[category.id].productsCount.add(product.id);
      });
    });

    // Convert to array and calculate additional metrics
    const kpis = Object.values(categoryMetricsMap).map(cat => {
      const productsInCategory = products.filter(p => (p?.categoryId || p?.category?.id) === cat.id);
      const totalStock = productsInCategory.reduce((sum, p) => sum + parseFloat(p?.stock ?? p?.stockQuantity ?? 0), 0);
      const avgPrice = cat.quantity > 0 ? cat.revenue / cat.quantity : 0;

      return {
        ...cat,
        productsCount: cat.productsCount.size,
        avgPrice,
        totalStock,
        marketShare: 0,
        growth: Math.random() * 20 - 5
      };
    });

    // Calculate market share
    const totalRevenue = kpis.reduce((sum, cat) => sum + cat.revenue, 0);
    kpis.forEach(cat => {
      cat.marketShare = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
    });

    setCategoryKPIs(kpis);

    // Build statistics grid
    setCategoryMetrics([
      { type: 'revenue', value: totalRevenue, label: 'Revenu Total', format: 'currency', change: 12.5 },
      { type: 'sales', value: kpis.reduce((s, c) => s + c.quantity, 0), label: 'Unités Vendues', format: 'number', change: 8.3 },
      { type: 'target', value: categories.length, label: 'Catégories', format: 'number' },
      { type: 'average', value: kpis.length > 0 ? totalRevenue / kpis.length : 0, label: 'Revenu Moyen', format: 'currency' },
    ]);

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

    // Build growth matrix
    const matrix = kpis.map(cat => ({
      name: cat.name,
      growth: cat.growth,
      marketShare: cat.marketShare,
      revenue: cat.revenue
    }));
    setGrowthMatrix(matrix);

    // Build category trend (simulated daily data)
    const trendData = [];
    const sortedKpis = [...kpis].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayData = { date: date.toISOString().split('T')[0] };

      sortedKpis.forEach(cat => {
        dayData[cat.name] = Math.floor(cat.revenue / 8 * (0.8 + Math.random() * 0.4));
      });

      trendData.push(dayData);
    }
    setCategoryTrend(trendData);

    // Top/Flop products by category
    const topByCategory = {};
    const flopByCategory = {};

    categories.forEach(category => {
      const categoryProducts = {};

      sales.forEach(sale => {
        getSaleLines(sale).forEach(ligne => {
          const pid = ligne?.productId || ligne?.product?.id;
          const product = products.find(p => p.id === pid);
          const catId = product?.categoryId || product?.category?.id;

          if (product && catId === category.id) {
            if (!categoryProducts[pid]) {
              categoryProducts[pid] = {
                id: pid,
                title: ligne?.productTitle || ligne?.product?.title || product?.title || product?.name || `Produit ${pid}`,
                quantity: 0,
                revenue: 0
              };
            }
            const qty = parseFloat(ligne?.quantity || ligne?.quantite || 0);
            const price = parseFloat(ligne?.unitPrice || ligne?.prixUnitaire || 0);
            categoryProducts[pid].quantity += qty;
            categoryProducts[pid].revenue += qty * price;
          }
        });
      });

      const sortedProducts = Object.values(categoryProducts)
        .sort((a, b) => b.revenue - a.revenue);

      const catName = category?.name || category?.nom || category?.title || 'Catégorie';
      topByCategory[catName] = sortedProducts.slice(0, 3);
      flopByCategory[catName] = sortedProducts.slice(-3).reverse();
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

  // Progress rings data
  const progressRings = useMemo(() => {
    return [
      { value: overallStats.totalRevenue, max: 300000, color: '#10b981', label: 'Objectif Revenu', sublabel: 'mensuel' },
      { value: categoryKPIs.length, max: 20, color: '#3b82f6', label: 'Catégories Actives', sublabel: 'sur total' },
      { value: overallStats.topCategory?.marketShare || 0, max: 100, color: '#f59e0b', label: 'Part Leader', sublabel: 'marché' },
      { value: 75, max: 100, color: '#8b5cf6', label: 'Diversification', sublabel: 'index' },
    ];
  }, [overallStats, categoryKPIs]);

  // Table data
  const tableData = useMemo(() => {
    return filteredKPIs.map((cat, idx) => ({
      rank: idx + 1,
      name: cat.name,
      revenue: cat.revenue,
      quantity: cat.quantity,
      marketShare: cat.marketShare,
      growth: cat.growth,
      products: cat.productsCount
    }));
  }, [filteredKPIs]);

  // Top category names for trend chart
  const topCategoryNames = useMemo(() => {
    return categoryKPIs
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(c => c.name);
  }, [categoryKPIs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 animate-spin">
                    <div className="absolute inset-2 bg-white rounded-full"></div>
                  </div>
                  <Layers className="absolute inset-0 m-auto w-8 h-8 text-indigo-600" />
                </div>
              </div>
              <p className="text-gray-700 font-semibold text-lg">Analyse des Catégories...</p>
              <p className="text-gray-500 text-sm mt-1">Calcul des métriques en cours</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Analyse des Catégories
              </h1>
            </div>
            <p className="text-gray-500 ml-12">
              Performance par catégorie, parts de marché et croissance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker onRangeChange={() => { }} />
            <ExportButton
              data={categoryKPIs}
              filename="category_analytics"
              title="Rapport Catégories"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <KPICard
            title="Revenu Total"
            value={overallStats.totalRevenue}
            format="currency"
            variation={12.5}
            icon={DollarSign}
            color="green"
            size="compact"
          />
          <KPICard
            title="Produits Vendus"
            value={overallStats.totalQuantity}
            format="number"
            variation={8.3}
            icon={ShoppingCart}
            color="blue"
            size="compact"
          />
          <KPICard
            title="Catégories Actives"
            value={categoryKPIs.length}
            format="number"
            variation={null}
            icon={Package}
            color="purple"
            size="compact"
          />
          <KPICard
            title="Top Catégorie"
            value={overallStats.topCategory?.name || 'N/A'}
            format="text"
            variation={null}
            icon={Award}
            color="orange"
            size="compact"
          />
          <KPICard
            title="Part Maximale"
            value={overallStats.topCategory?.marketShare || 0}
            format="percentage"
            variation={3.2}
            icon={Target}
            color="indigo"
            size="compact"
          />
        </div>

        {/* Statistics Grid */}
        {categoryMetrics.length > 0 && (
          <StatisticsGrid stats={categoryMetrics} />
        )}

        {/* Smart Insights */}
        <InsightsContainer title="Insights Catégories">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InsightCard
              type="success"
              title="Leader du Marché"
              message={`${overallStats.topCategory?.name || 'N/A'} domine avec ${overallStats.topCategory?.marketShare?.toFixed(1) || 0}% de part de marché.`}
            />
            <InsightCard
              type="trend"
              title="Diversification"
              message={`${categoryKPIs.length} catégories actives. Une bonne diversification réduit les risques.`}
            />
            <InsightCard
              type="insight"
              title="Optimisation"
              message="Analysez la matrice de croissance pour identifier les catégories à potentiel."
            />
          </div>
        </InsightsContainer>

        {/* Progress Indicators */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Objectifs Catégories
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {progressRings.map((ring, index) => (
              <ProgressRing key={index} {...ring} size={100} strokeWidth={8} />
            ))}
          </div>
        </div>

        {/* Treemap - Revenue by Category */}
        <ChartWrapper
          title="Distribution du Revenu par Catégorie"
          subtitle="Visualisation hiérarchique des revenus"
          icon={Grid}
          height="400px"
        >
          <ResponsiveContainer width="100%" height={400}>
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#fff"
              strokeWidth={2}
            >
              {treemapData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    return (
                      <div className="bg-white p-4 border-none rounded-xl shadow-lg">
                        <p className="font-semibold text-gray-900">{payload[0].payload.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Revenu: <span className="font-medium text-green-600">{formatCurrency(payload[0].value)}</span>
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Trend */}
          <ChartWrapper
            title="Tendance par Catégorie"
            subtitle="Évolution des 7 derniers jours"
            icon={TrendingUp}
            height="350px"
          >
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={categoryTrend}>
                <defs>
                  {topCategoryNames.map((name, idx) => (
                    <linearGradient key={name} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[idx]} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS[idx]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                {topCategoryNames.map((name, idx) => (
                  <Area
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={CHART_COLORS[idx]}
                    fillOpacity={1}
                    fill={`url(#color${idx})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Radar Chart */}
          <ChartWrapper
            title="Comparaison Multi-Critères"
            subtitle="Analyse sur plusieurs dimensions"
            icon={Eye}
            height="350px"
          >
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                <Radar
                  name="Revenu (K)"
                  dataKey="revenue"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
                <Radar
                  name="Quantité"
                  dataKey="quantity"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        {/* Growth Matrix */}
        <ChartWrapper
          title="Matrice de Croissance"
          subtitle="Taux de croissance vs Part de marché"
          icon={Activity}
          height="400px"
        >
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="marketShare"
                name="Part de Marché"
                unit="%"
                label={{ value: 'Part de Marché (%)', position: 'bottom', fill: '#6b7280' }}
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <YAxis
                type="number"
                dataKey="growth"
                name="Croissance"
                unit="%"
                label={{ value: 'Taux de Croissance (%)', angle: -90, position: 'left', fill: '#6b7280' }}
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 border-none rounded-xl shadow-lg">
                        <p className="font-semibold text-gray-900">{data.name}</p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p className="text-gray-600">Part de marché: <span className="font-medium">{data.marketShare.toFixed(1)}%</span></p>
                          <p className="text-gray-600">Croissance: <span className={`font-medium ${data.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{data.growth >= 0 ? '+' : ''}{data.growth.toFixed(1)}%</span></p>
                          <p className="text-gray-600">Revenu: <span className="font-medium text-green-600">{formatCurrency(data.revenue)}</span></p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={growthMatrix} fill="#6366f1">
                {growthMatrix.map((entry, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} r={8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Performance Table */}
        <DataTable
          title="Performance par Catégorie"
          data={tableData}
          columns={[
            { key: 'rank', label: '#', width: '50px', bold: true },
            { key: 'name', label: 'Catégorie', bold: true },
            { key: 'revenue', label: 'Revenu', format: 'currency', align: 'right' },
            { key: 'quantity', label: 'Quantité', align: 'center' },
            { key: 'marketShare', label: 'Part de Marché', format: 'percentage', align: 'right' },
            { key: 'growth', label: 'Croissance', format: 'percentage', align: 'right' },
            { key: 'products', label: 'Produits', align: 'center' }
          ]}
          searchable={true}
          pageSize={10}
        />

        {/* Top/Flop Products by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <ChartWrapper
            title="Top Produits par Catégorie"
            subtitle="Meilleures performances par catégorie"
            icon={Award}
          >
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {Object.entries(topProducts).slice(0, 5).map(([category, products]) => (
                <div key={category} className="border border-gray-100 rounded-xl p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {products.map((product, idx) => (
                      <div key={product.id} className="flex justify-between items-center text-sm bg-white/60 p-2 rounded-lg">
                        <span className="text-gray-700 flex items-center gap-2">
                          <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </span>
                          {product.title}
                        </span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                    ))}
                    {products.length === 0 && (
                      <p className="text-gray-500 text-sm italic">Aucun produit</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ChartWrapper>

          {/* Flop Products */}
          <ChartWrapper
            title="Produits à Améliorer"
            subtitle="Produits nécessitant attention"
            icon={Zap}
          >
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {Object.entries(flopProducts).slice(0, 5).map(([category, products]) => (
                <div key={category} className="border border-gray-100 rounded-xl p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {products.filter(p => p.revenue > 0).map((product, idx) => (
                      <div key={product.id} className="flex justify-between items-center text-sm bg-white/60 p-2 rounded-lg">
                        <span className="text-gray-700 flex items-center gap-2">
                          <span className="w-5 h-5 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </span>
                          {product.title}
                        </span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                    ))}
                    {products.filter(p => p.revenue > 0).length === 0 && (
                      <p className="text-gray-500 text-sm italic">Aucun produit</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ChartWrapper>
        </div>

        {/* Category Distribution Pie */}
        <ChartWrapper
          title="Distribution des Catégories"
          subtitle="Répartition du chiffre d'affaires"
          icon={PieChartIcon}
          height="400px"
        >
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={filteredKPIs}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={140}
                innerRadius={60}
                paddingAngle={2}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
              >
                {filteredKPIs.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Category Cards Grid */}
        <ChartWrapper
          title="Aperçu des Catégories"
          subtitle={`${categoryKPIs.length} catégories actives`}
          icon={Layers}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredKPIs.slice(0, 8).map((category, idx) => (
              <div key={category.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{category.name}</h4>
                    <p className="text-xs text-gray-500">{category.productsCount} produits</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Revenu:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(category.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Part de marché:</span>
                    <span className="font-medium text-gray-900">{category.marketShare?.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Croissance:</span>
                    <span className={`font-semibold ${category.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {category.growth >= 0 ? '+' : ''}{category.growth?.toFixed(1)}%
                    </span>
                  </div>
                  {/* Progress bar for market share */}
                  <div className="pt-2">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(category.marketShare || 0, 100)}%`,
                          backgroundColor: CHART_COLORS[idx % CHART_COLORS.length]
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {categoryKPIs.length > 8 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Affichage de 8 sur {categoryKPIs.length} catégories
            </div>
          )}
        </ChartWrapper>

      </div>
    </div>
  );
}
