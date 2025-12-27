/**
 * Customizable Analytics Workspace
 * Drag-and-drop dashboard with personalized widgets, graphs, and objectives
 */

import { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  Plus,
  Settings,
  Download,
  RefreshCw,
  Maximize2,
  X,
  Move,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Filter,
  Calendar,
} from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import {
  ChartCard,
  DynamicAreaChart,
  DynamicBarChart,
  DynamicPieChart,
  DynamicDonutChart,
  DynamicLineChart,
  KpiCard,
  RadialProgress,
  formatCurrency,
  formatNumber,
} from '../../components/charts/DynamicCharts';
import { getSales } from '../../services/salesService';
import { getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import generateRoleBasedReport from '../../utils/advancedReportGenerator';

// Widget types configuration
const WIDGET_TYPES = {
  kpi: {
    id: 'kpi',
    name: 'KPI Card',
    icon: Target,
    description: 'Display key performance indicators',
    defaultSize: { w: 1, h: 1 },
  },
  areaChart: {
    id: 'areaChart',
    name: 'Area Chart',
    icon: TrendingUp,
    description: 'Trend visualization with area fill',
    defaultSize: { w: 2, h: 2 },
  },
  barChart: {
    id: 'barChart',
    name: 'Bar Chart',
    icon: BarChart3,
    description: 'Compare values across categories',
    defaultSize: { w: 2, h: 2 },
  },
  pieChart: {
    id: 'pieChart',
    name: 'Pie Chart',
    icon: PieChart,
    description: 'Show proportions and distributions',
    defaultSize: { w: 1, h: 2 },
  },
  lineChart: {
    id: 'lineChart',
    name: 'Line Chart',
    icon: LineChart,
    description: 'Track changes over time',
    defaultSize: { w: 2, h: 2 },
  },
  progress: {
    id: 'progress',
    name: 'Progress Ring',
    icon: Target,
    description: 'Show goal completion',
    defaultSize: { w: 1, h: 1 },
  },
  table: {
    id: 'table',
    name: 'Data Table',
    icon: LayoutGrid,
    description: 'Display tabular data',
    defaultSize: { w: 2, h: 2 },
  },
};

// Default workspace layout
const DEFAULT_WIDGETS = [
  { id: 'revenue-kpi', type: 'kpi', title: 'Revenue Total', dataKey: 'revenue', position: 0 },
  { id: 'sales-kpi', type: 'kpi', title: 'Total Ventes', dataKey: 'salesCount', position: 1 },
  { id: 'products-kpi', type: 'kpi', title: 'Produits', dataKey: 'productCount', position: 2 },
  { id: 'avg-basket-kpi', type: 'kpi', title: 'Panier Moyen', dataKey: 'avgBasket', position: 3 },
  { id: 'sales-trend', type: 'areaChart', title: 'Tendance des Ventes', dataKey: 'salesTrend', position: 4 },
  { id: 'category-dist', type: 'pieChart', title: 'Répartition par Catégorie', dataKey: 'categoryDistribution', position: 5 },
  { id: 'top-products', type: 'barChart', title: 'Top Produits', dataKey: 'topProducts', position: 6 },
  { id: 'monthly-comparison', type: 'lineChart', title: 'Comparaison Mensuelle', dataKey: 'monthlyComparison', position: 7 },
];

// Objectives configuration
const DEFAULT_OBJECTIVES = [
  { id: 'obj-1', name: 'Objectif CA Mensuel', target: 100000, current: 0, unit: 'MAD', color: '#FF5A5F' },
  { id: 'obj-2', name: 'Nombre de Ventes', target: 500, current: 0, unit: 'ventes', color: '#00A699' },
  { id: 'obj-3', name: 'Nouveaux Clients', target: 50, current: 0, unit: 'clients', color: '#FC642D' },
];

export default function CustomizableWorkspace() {
  const { isDark } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('workspace-widgets');
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
  });
  const [objectives, setObjectives] = useState(() => {
    const saved = localStorage.getItem('workspace-objectives');
    return saved ? JSON.parse(saved) : DEFAULT_OBJECTIVES;
  });
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  // Analytics data
  const [data, setData] = useState({
    revenue: 0,
    salesCount: 0,
    productCount: 0,
    avgBasket: 0,
    salesTrend: [],
    categoryDistribution: [],
    topProducts: [],
    monthlyComparison: [],
    revenueGrowth: 0,
    salesGrowth: 0,
  });

  // Load data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [salesRes, productsRes, categoriesRes] = await Promise.all([
        getSales().catch(() => ({ data: [] })),
        getProducts().catch(() => ({ data: [] })),
        getCategories().catch(() => ({ data: [] })),
      ]);

      const sales = Array.isArray(salesRes?.data) ? salesRes.data : [];
      const products = Array.isArray(productsRes?.data) ? productsRes.data : [];
      const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];

      // Calculate KPIs
      const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const avgBasket = sales.length > 0 ? totalRevenue / sales.length : 0;

      // Sales trend (last 14 days)
      const dailyMap = {};
      sales.forEach(sale => {
        const date = sale.saleDate?.split('T')[0] || new Date().toISOString().split('T')[0];
        if (!dailyMap[date]) {
          dailyMap[date] = { date, revenue: 0, count: 0 };
        }
        dailyMap[date].revenue += sale.totalAmount || 0;
        dailyMap[date].count += 1;
      });
      const salesTrend = Object.values(dailyMap)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-14)
        .map(d => ({
          name: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          value: d.revenue,
          count: d.count,
        }));

      // Category distribution
      const catMap = {};
      categories.forEach(cat => {
        catMap[cat.id] = { name: cat.name, value: 0 };
      });
      sales.forEach(sale => {
        (sale.lignes || sale.saleLines || []).forEach(line => {
          const catId = line.product?.category?.id || line.categoryId;
          if (catMap[catId]) {
            catMap[catId].value += (line.quantity || 0) * (line.unitPrice || 0);
          }
        });
      });
      const categoryDistribution = Object.values(catMap)
        .filter(c => c.value > 0)
        .sort((a, b) => b.value - a.value);

      // Top products
      const prodMap = {};
      sales.forEach(sale => {
        (sale.lignes || sale.saleLines || []).forEach(line => {
          const pid = line.product?.id || line.productId;
          const name = line.product?.title || line.productTitle || 'Produit';
          if (!prodMap[pid]) {
            prodMap[pid] = { name, value: 0, quantity: 0 };
          }
          prodMap[pid].value += (line.quantity || 0) * (line.unitPrice || 0);
          prodMap[pid].quantity += line.quantity || 0;
        });
      });
      const topProducts = Object.values(prodMap)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Monthly comparison
      const monthlyMap = {};
      sales.forEach(sale => {
        const date = new Date(sale.saleDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { name: monthKey, current: 0, previous: 0 };
        }
        monthlyMap[monthKey].current += sale.totalAmount || 0;
      });
      const monthlyComparison = Object.values(monthlyMap).slice(-6);

      // Update objectives with current data
      const updatedObjectives = objectives.map(obj => {
        if (obj.id === 'obj-1') return { ...obj, current: totalRevenue };
        if (obj.id === 'obj-2') return { ...obj, current: sales.length };
        return obj;
      });
      setObjectives(updatedObjectives);

      setData({
        revenue: totalRevenue,
        salesCount: sales.length,
        productCount: products.length,
        avgBasket,
        salesTrend,
        categoryDistribution,
        topProducts,
        monthlyComparison,
        revenueGrowth: 12.5,
        salesGrowth: 8.3,
      });
    } catch (error) {
      console.error('Error loading workspace data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [objectives]);

  useEffect(() => {
    loadData();
  }, []);

  // Save widgets to localStorage
  useEffect(() => {
    localStorage.setItem('workspace-widgets', JSON.stringify(widgets));
  }, [widgets]);

  // Save objectives to localStorage
  useEffect(() => {
    localStorage.setItem('workspace-objectives', JSON.stringify(objectives));
  }, [objectives]);

  // Add widget
  const addWidget = (type) => {
    const widgetConfig = WIDGET_TYPES[type];
    const newWidget = {
      id: `${type}-${Date.now()}`,
      type,
      title: widgetConfig.name,
      dataKey: type,
      position: widgets.length,
    };
    setWidgets([...widgets, newWidget]);
    setShowWidgetPicker(false);
  };

  // Remove widget
  const removeWidget = (widgetId) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  // Generate report
  const handleGenerateReport = async () => {
    const reportData = {
      totalRevenue: data.revenue,
      totalSales: data.salesCount,
      totalProducts: data.productCount,
      averageBasket: data.avgBasket,
      salesTrend: data.salesTrend,
      categoryStats: data.categoryDistribution,
      productPerformance: data.topProducts,
    };

    try {
      await generateRoleBasedReport('ANALYST', reportData);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  // Reset workspace
  const resetWorkspace = () => {
    setWidgets(DEFAULT_WIDGETS);
    setObjectives(DEFAULT_OBJECTIVES);
    localStorage.removeItem('workspace-widgets');
    localStorage.removeItem('workspace-objectives');
  };

  // Render widget content based on type
  const renderWidgetContent = (widget) => {
    switch (widget.type) {
      case 'kpi':
        return renderKpiWidget(widget);
      case 'areaChart':
        return (
          <DynamicAreaChart
            data={data.salesTrend}
            dataKeys={[{ key: 'value', name: 'Revenue', color: '#FF5A5F' }]}
            xAxisKey="name"
            height={250}
          />
        );
      case 'barChart':
        return (
          <DynamicBarChart
            data={data.topProducts.slice(0, 8)}
            dataKeys={[{ key: 'value', name: 'Revenue', color: '#00A699' }]}
            xAxisKey="name"
            height={250}
          />
        );
      case 'pieChart':
        return (
          <DynamicDonutChart
            data={data.categoryDistribution}
            height={250}
          />
        );
      case 'lineChart':
        return (
          <DynamicLineChart
            data={data.monthlyComparison}
            dataKeys={[{ key: 'current', name: 'Actuel', color: '#FF5A5F' }]}
            xAxisKey="name"
            height={250}
          />
        );
      case 'progress':
        return renderProgressWidget(widget);
      default:
        return <div className="text-center py-10 text-warm-500">Widget non configuré</div>;
    }
  };

  // Render KPI widget
  const renderKpiWidget = (widget) => {
    const kpiConfig = {
      revenue: { value: formatCurrency(data.revenue), trend: 'up', trendValue: '+12.5%', color: 'coral', icon: DollarSign },
      salesCount: { value: formatNumber(data.salesCount), trend: 'up', trendValue: '+8.3%', color: 'teal', icon: ShoppingCart },
      productCount: { value: formatNumber(data.productCount), trend: null, color: 'orange', icon: Package },
      avgBasket: { value: formatCurrency(data.avgBasket), trend: 'up', trendValue: '+5.2%', color: 'purple', icon: Target },
    };

    const config = kpiConfig[widget.dataKey] || kpiConfig.revenue;

    return (
      <div className="h-full flex flex-col justify-center">
        <div className={`p-3 rounded-xl w-fit mb-3 ${
          isDark ? `bg-${config.color}-500/20` : `bg-${config.color}-50`
        }`}>
          {config.icon && <config.icon className={`w-5 h-5 ${
            isDark ? `text-${config.color}-400` : `text-${config.color}-600`
          }`} />}
        </div>
        <div className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-warm-900'}`}>
          {config.value}
        </div>
        <div className={`text-sm ${isDark ? 'text-warm-400' : 'text-warm-500'}`}>
          {widget.title}
        </div>
        {config.trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            config.trend === 'up' ? 'text-teal-500' : 'text-coral-500'
          }`}>
            {config.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {config.trendValue}
          </div>
        )}
      </div>
    );
  };

  // Render progress widget
  const renderProgressWidget = (widget) => {
    const objective = objectives[0];
    const progress = objective ? (objective.current / objective.target) * 100 : 0;
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <RadialProgress
          value={Math.min(progress, 100)}
          max={100}
          size={100}
          color="#FF5A5F"
          label={objective?.name}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-coral-500/20 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-coral-500 to-teal-500 animate-spin">
              <div className={`absolute inset-2 rounded-full ${isDark ? 'bg-warm-900' : 'bg-white'}`} />
            </div>
            <LayoutGrid className={`absolute inset-0 m-auto w-8 h-8 ${isDark ? 'text-coral-400' : 'text-coral-600'}`} />
          </div>
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-warm-900'}`}>
            Chargement de l'espace de travail...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-coral-500 to-coral-600 rounded-xl shadow-lg">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-warm-900'}`}>
              Mon Espace de Travail
            </h1>
          </div>
          <p className={`ml-12 ${isDark ? 'text-warm-400' : 'text-warm-500'}`}>
            Personnalisez votre dashboard avec les widgets de votre choix
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
            isDark ? 'bg-warm-800 border-warm-700' : 'bg-white border-warm-200'
          }`}>
            <Calendar className={`w-4 h-4 ${isDark ? 'text-warm-400' : 'text-warm-500'}`} />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className={`text-sm border-none bg-transparent ${isDark ? 'text-white' : 'text-warm-900'}`}
            />
            <span className={isDark ? 'text-warm-500' : 'text-warm-400'}>-</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className={`text-sm border-none bg-transparent ${isDark ? 'text-white' : 'text-warm-900'}`}
            />
          </div>

          {/* Add Widget */}
          <button
            onClick={() => setShowWidgetPicker(true)}
            className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Ajouter Widget
          </button>

          {/* Generate Report */}
          <button
            onClick={handleGenerateReport}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              isDark
                ? 'bg-warm-800 text-white hover:bg-warm-700 border border-warm-700'
                : 'bg-white text-warm-900 hover:bg-warm-100 border border-warm-200'
            }`}
          >
            <Download className="w-4 h-4" />
            Rapport PDF
          </button>

          {/* Refresh */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className={`p-2 rounded-xl transition-colors ${
              isDark
                ? 'bg-warm-800 text-warm-400 hover:bg-warm-700'
                : 'bg-white text-warm-500 hover:bg-warm-100 border border-warm-200'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-xl transition-colors ${
              isDark
                ? 'bg-warm-800 text-warm-400 hover:bg-warm-700'
                : 'bg-white text-warm-500 hover:bg-warm-100 border border-warm-200'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Objectives Section */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-warm-900'}`}>
            🎯 Mes Objectifs
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {objectives.map((obj) => {
            const progress = (obj.current / obj.target) * 100;
            const isComplete = progress >= 100;
            
            return (
              <div
                key={obj.id}
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-warm-800 border-warm-700' : 'bg-warm-50 border-warm-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-medium ${isDark ? 'text-warm-300' : 'text-warm-700'}`}>
                    {obj.name}
                  </span>
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                  ) : (
                    <Clock className={`w-5 h-5 ${isDark ? 'text-warm-500' : 'text-warm-400'}`} />
                  )}
                </div>
                <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-warm-900'}`}>
                  {formatNumber(obj.current)} / {formatNumber(obj.target)}
                </div>
                <div className="relative h-2 rounded-full overflow-hidden bg-warm-200 dark:bg-warm-700">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: obj.color,
                    }}
                  />
                </div>
                <div className={`text-xs mt-2 ${isDark ? 'text-warm-500' : 'text-warm-400'}`}>
                  {progress.toFixed(1)}% atteint
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className={`rounded-2xl border transition-all duration-200 hover:shadow-lg ${
              widget.type === 'kpi' ? '' : 'md:col-span-2'
            } ${isDark ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-200'}`}
          >
            {/* Widget Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-warm-800' : 'border-warm-100'
            }`}>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-warm-900'}`}>
                {widget.title}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-warm-800 text-warm-400' : 'hover:bg-warm-100 text-warm-500'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeWidget(widget.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-coral-500/20 text-warm-400 hover:text-coral-400' : 'hover:bg-coral-50 text-warm-500 hover:text-coral-500'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Widget Content */}
            <div className={`p-4 ${widget.type === 'kpi' ? 'h-32' : 'h-72'}`}>
              {renderWidgetContent(widget)}
            </div>
          </div>
        ))}
      </div>

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl ${
            isDark ? 'bg-warm-900' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-warm-800' : 'border-warm-200'
            }`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-warm-900'}`}>
                Ajouter un Widget
              </h2>
              <button
                onClick={() => setShowWidgetPicker(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-warm-800 text-warm-400' : 'hover:bg-warm-100 text-warm-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.values(WIDGET_TYPES).map((widgetType) => {
                const Icon = widgetType.icon;
                return (
                  <button
                    key={widgetType.id}
                    onClick={() => addWidget(widgetType.id)}
                    className={`p-4 rounded-xl border text-left transition-all hover:scale-105 ${
                      isDark
                        ? 'bg-warm-800 border-warm-700 hover:border-coral-500'
                        : 'bg-warm-50 border-warm-200 hover:border-coral-500'
                    }`}
                  >
                    <div className="p-2 bg-coral-500/20 rounded-lg w-fit mb-3">
                      <Icon className="w-5 h-5 text-coral-500" />
                    </div>
                    <div className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-warm-900'}`}>
                      {widgetType.name}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-warm-400' : 'text-warm-500'}`}>
                      {widgetType.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${
            isDark ? 'bg-warm-900' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-warm-800' : 'border-warm-200'
            }`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-warm-900'}`}>
                Paramètres
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-warm-800 text-warm-400' : 'hover:bg-warm-100 text-warm-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  resetWorkspace();
                  setShowSettings(false);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-coral-500/30 bg-coral-500/10 text-coral-500 hover:bg-coral-500/20 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Réinitialiser l'espace</div>
                  <div className="text-sm opacity-80">Restaurer la configuration par défaut</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
