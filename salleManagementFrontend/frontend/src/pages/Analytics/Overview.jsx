import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Package,
  BarChart2,
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
  Legend,
} from "recharts";
import AnalyticsService from "../../services/analyticsService";
import { getSales } from "../../services/salesService";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import KPICard from "../../components/Analytics/KPICard";
import ChartWrapper from "../../components/Analytics/ChartWrapper";
import ExportButton from "../../components/Analytics/ExportButton";
import DateRangePicker from "../../components/Analytics/DateRangePicker";
import InsightCard, { InsightsContainer } from "../../components/Analytics/InsightCard";

import { generateForecast } from "../../utils/analyticsCalculations";
import { GA_COLORS, CHART_COLORS, formatCurrency, getHeatColor } from "../../utils/chartHelpers";
import { prepareAnalyticsExport } from "../../utils/exportHelpers";


const buildHeatmapMatrix = (sales) => {
  const matrix = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );

  sales.forEach((s) => {
    const d = new Date(s.saleDate);
    const day = d.getDay();
    const hour = d.getHours();
    matrix[day][hour] += s.totalAmount;
  });

  return matrix;
};

/* ========================================================
   MAIN COMPONENT
======================================================== */
export default function OverviewAnalytics() {
  const [kpi, setKpi] = useState(null);
  const [kpiComparison, setKpiComparison] = useState(null);
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [monthlyForecast, setMonthlyForecast] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [bestProducts, setBestProducts] = useState([]);
  const [hourlySales, setHourlySales] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [insights, setInsights] = useState([]);
  
  const [loading, setLoading] = useState(true);

  /* ========================================================
      LOAD ANALYTICS
  ======================================================== */
  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [kpiRes, dailyRes, monthlyRes, catRes, bestRes] = await Promise.all([
        AnalyticsService.getGlobalKpi(),
        AnalyticsService.getDailySales(),
        AnalyticsService.getMonthlySales(),
        AnalyticsService.getCategoryStats(),
        AnalyticsService.getBestSellers(5),
      ]);

      setKpi(kpiRes.data);
      setDaily(dailyRes.data);
      setMonthly(monthlyRes.data);
      setCategoryStats(catRes.data);
      setBestProducts(bestRes.data);

      // Calculate comparisons
      calculateComparisons(kpiRes.data);

      // Generate forecast
      if (monthlyRes.data.length > 0) {
        const forecast = generateForecast(
          monthlyRes.data.map(m => ({ date: m.month, value: m.revenue })),
          3
        );
        setMonthlyForecast(forecast);
      }

      // Build heatmap
      const salesRaw = await getSales();
      setHeatmap(buildHeatmapMatrix(salesRaw.data));

      // Generate insights
      generateInsights(kpiRes.data, salesRaw.data);

    } catch (err) {
      console.warn("⚠ Analytics API not available, switching to fallback mode", err);
      await loadFallback();
    } finally {
      setLoading(false);
    }
  };

  /* ========================================================
      FALLBACK LOCAL CALCULATION
  ======================================================== */
  const loadFallback = async () => {
    const [s, p, c] = await Promise.all([getSales(), getProducts(), getCategories()]);
    const sales = s.data;
    const products = p.data;
    const categories = c.data;

    /* KPI */
    const totalRev = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const avgOrder = sales.length ? totalRev / sales.length : 0;

    const kpiData = {
      totalRevenue: totalRev,
      totalSales: sales.length,
      averageBasket: avgOrder,
      lowStockCount: products.filter((p) => p.stock < 5).length,
    };
    setKpi(kpiData);

    // Calculate comparisons
    calculateComparisons(kpiData);

    /* Daily */
    const dailyMap = {};
    sales.forEach((s) => {
      const d = s.saleDate.split("T")[0];
      dailyMap[d] = (dailyMap[d] || 0) + s.totalAmount;
    });
    const dailyData = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));
    setDaily(dailyData);

    /* Monthly */
    const monthlyMap = {};
    sales.forEach((s) => {
      const d = new Date(s.saleDate);
      const month = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyMap[month] = (monthlyMap[month] || 0) + s.totalAmount;
    });
    const monthlyData = Object.entries(monthlyMap).map(([month, revenue]) => ({ month, revenue }));
    setMonthly(monthlyData);

    // Generate forecast
    if (monthlyData.length > 0) {
      const forecast = generateForecast(
        monthlyData.map(m => ({ date: m.month, value: m.revenue })),
        3
      );
      setMonthlyForecast(forecast);
    }

    /* Categories */
    const catMap = {};
    sales.forEach((sale) => {
      sale.lignes?.forEach((l) => {
        const prod = products.find((x) => x.id === l.productId);
        if (!prod) return;
        const cat = categories.find((x) => x.id === prod.categoryId);
        if (!cat) return;

        catMap[cat.name] = (catMap[cat.name] || 0) + l.quantity * l.unitPrice;
      });
    });
    setCategoryStats(
      Object.entries(catMap).map(([categoryName, totalRevenue]) => ({
        categoryName,
        totalRevenue,
      }))
    );

    /* Best sellers */
    const prodCount = {};
    sales.forEach((s) =>
      s.lignes?.forEach((l) => {
        prodCount[l.productTitle] = (prodCount[l.productTitle] || 0) + l.quantity;
      })
    );
    setBestProducts(
      Object.entries(prodCount)
        .map(([productTitle, totalQuantity]) => ({ productTitle, totalQuantity }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5)
    );

    /* Hourly */
    const hourMap = {};
    sales.forEach((s) => {
      const hour = new Date(s.saleDate).getHours();
      hourMap[hour] = (hourMap[hour] || 0) + s.totalAmount;
    });
    setHourlySales(
      Array.from({ length: 24 }).map((_, h) => ({
        hour: `${h}:00`,
        revenue: hourMap[h] || 0,
      }))
    );

    /* Heatmap */
    setHeatmap(buildHeatmapMatrix(sales));

    // Generate insights
    generateInsights(kpiData);
  };

  /* ========================================================
      CALCULATE COMPARISONS
  ======================================================== */
  const calculateComparisons = (kpiData) => {
    // Simulate comparison with previous period
    setKpiComparison({
      revenueGrowth: 12.5,
      salesGrowth: 8.3,
      basketGrowth: -2.1,
      stockAlert: kpiData.lowStockCount > 10
    });
  };

  /* ========================================================
      GENERATE INSIGHTS
  ======================================================== */
  const generateInsights = (kpiData) => {
    const insights = [];

    // Revenue trend insight
    if (kpiComparison?.revenueGrowth > 10) {
      insights.push({
        type: 'success',
        title: 'Strong Revenue Growth',
        message: `Revenue increased by ${kpiComparison.revenueGrowth.toFixed(1)}% compared to last period.`
      });
    } else if (kpiComparison?.revenueGrowth < 0) {
      insights.push({
        type: 'warning',
        title: 'Revenue Decline',
        message: `Revenue decreased by ${Math.abs(kpiComparison.revenueGrowth).toFixed(1)}%. Consider promotional strategies.`
      });
    }

    // Stock alert
    if (kpiData.lowStockCount > 10) {
      insights.push({
        type: 'danger',
        title: 'Low Stock Alert',
        message: `${kpiData.lowStockCount} products are running low on stock. Restock soon to avoid stockouts.`
      });
    }

    // Peak hours insight
    if (hourlySales.length > 0) {
      const peakHour = hourlySales.reduce((max, h) => h.revenue > max.revenue ? h : max, hourlySales[0]);
      insights.push({
        type: 'insight',
        title: 'Peak Sales Hour',
        message: `Most sales occur at ${peakHour.hour}. Optimize staffing during this time.`
      });
    }

    setInsights(insights);
  };

  /* ========================================================
      EXPORT DATA PREPARATION
  ======================================================== */
  const exportData = useMemo(() => {
    return prepareAnalyticsExport({
      kpi,
      daily,
      categories: categoryStats,
      products: bestProducts,
      sales: []
    });
  }, [kpi, daily, categoryStats, bestProducts]);

  /* ========================================================
      PDF EXPORT SECTIONS
  ======================================================== */
  const pdfSections = useMemo(() => {
    if (!kpi) return [];
    
    return [
      {
        title: 'KPI Summary',
        type: 'kpi',
        data: [
          { label: 'Total Revenue', value: formatCurrency(kpi.totalRevenue) },
          { label: 'Total Sales', value: kpi.totalSales },
          { label: 'Average Basket', value: formatCurrency(kpi.averageBasket) },
          { label: 'Low Stock Items', value: kpi.lowStockCount }
        ]
      },
      {
        title: 'Top Performing Categories',
        type: 'table',
        columns: ['Category', 'Revenue'],
        data: categoryStats.slice(0, 5).map(cat => ({
          Category: cat.categoryName,
          Revenue: formatCurrency(cat.totalRevenue)
        }))
      },
      {
        title: 'Best Selling Products',
        type: 'table',
        columns: ['Product', 'Quantity Sold'],
        data: bestProducts.map(prod => ({
          Product: prod.productTitle,
          'Quantity Sold': prod.totalQuantity
        }))
      }
    ];
  }, [kpi, categoryStats, bestProducts]);

  /* ========================================================
      LOADING UI
  ======================================================== */
  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading Analytics Dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );

  /* ========================================================
      UI RENDER
  ======================================================== */
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Overview</h1>
            <p className="text-gray-600 mt-1">Comprehensive business intelligence dashboard</p>
          </div>
          <ExportButton
            data={exportData}
            filename="analytics_overview"
            title="Analytics Overview Report"
            pdfSections={pdfSections}
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
            variation={kpiComparison?.revenueGrowth || 0} 
            icon={DollarSign} 
          />
          <KPICard 
            title="Sales" 
            value={kpi.totalSales} 
            format="number"
            variation={kpiComparison?.salesGrowth || 0} 
            icon={ShoppingCart} 
          />
          <KPICard 
            title="Avg Order" 
            value={kpi.averageBasket} 
            format="currency"
            variation={kpiComparison?.basketGrowth || 0} 
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

        {/* SMART INSIGHTS */}
        {insights.length > 0 && (
          <InsightsContainer>
            {insights.map((insight, idx) => (
              <InsightCard
                key={idx}
                type={insight.type}
                title={insight.title}
                message={insight.message}
              />
            ))}
          </InsightsContainer>
        )}

        {/* DAILY TREND */}
        <ChartWrapper
          title="Revenue Trend (Daily)"
          subtitle="Daily revenue performance over time"
          height="320px"
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <defs>
                <linearGradient id="gaBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GA_COLORS.blue} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={GA_COLORS.blueLight} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                dataKey="revenue"
                stroke={GA_COLORS.blue}
                fill="url(#gaBlue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* MONTHLY TREND WITH FORECAST */}
        {monthly.length > 0 && (
          <ChartWrapper
            title="Monthly Revenue Trend with Projections"
            subtitle="Historical data and 3-month forecast"
            height="350px"
          >
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={[...monthly, ...monthlyForecast]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value, name) => {
                    if (name === 'revenue') return [formatCurrency(value), 'Actual'];
                    if (name === 'value') return [formatCurrency(value), 'Forecast'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={GA_COLORS.blue}
                  strokeWidth={2}
                  dot={{ fill: GA_COLORS.blue, r: 4 }}
                  name="Actual Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={GA_COLORS.yellow}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: GA_COLORS.yellow, r: 4 }}
                  name="Forecasted Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        )}

        {/* CATEGORY DISTRIBUTION */}
        <ChartWrapper
          title="Category Contribution"
          subtitle="Revenue distribution across categories"
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
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis dataKey="productTitle" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="totalQuantity" fill={GA_COLORS.blue} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* HOURLY SALES */}
        <ChartWrapper
          title="Sales by Hour"
          subtitle="24-hour sales distribution"
          height="320px"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={hourlySales}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <Bar dataKey="revenue" fill={GA_COLORS.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* HEATMAP */}
        <ChartWrapper
          title="Sales Heatmap — Day × Hour"
          subtitle="Sales intensity visualization across the week"
        >
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-end gap-4 text-sm">
              <span className="text-gray-600">Low</span>
              <div className="flex gap-1">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((intensity, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-4 rounded"
                    style={{ backgroundColor: getHeatColor(intensity, 1, 'blue') }}
                  />
                ))}
              </div>
              <span className="text-gray-600">High</span>
            </div>

            {/* Heatmap Table */}
            <div className="overflow-x-auto">
              <table className="border-collapse w-full">
                <thead>
                  <tr>
                    <th className="p-2 text-xs font-semibold text-gray-700 text-left sticky left-0 bg-white">
                      Day / Hour
                    </th>
                    {[...Array(24).keys()].map((h) => (
                      <th key={h} className="p-1 text-[10px] text-gray-500 text-center">
                        {h}:00
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, row) => {
                    const shortDay = day.slice(0, 3);
                    return (
                      <tr key={row} className="hover:bg-gray-50">
                        <td className="p-2 text-xs font-medium text-gray-700 sticky left-0 bg-white">
                          {shortDay}
                        </td>

                        {heatmap[row]?.map((value, col) => {
                          const max = Math.max(...heatmap.flat());
                          const color = getHeatColor(value, max, 'blue');

                          return (
                            <td
                              key={col}
                              className="w-8 h-8 border border-gray-100 hover:scale-110 hover:shadow-lg transition-all duration-200 cursor-pointer"
                              style={{ backgroundColor: color }}
                              title={`${day} ${col}:00\nRevenue: ${formatCurrency(value)}`}
                            >
                              <span className="sr-only">{value.toFixed(2)}</span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </ChartWrapper>

      </div>
    </div>
  );
}
