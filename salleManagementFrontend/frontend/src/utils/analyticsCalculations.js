/**
 * Analytics Calculation Utilities
 * Provides fallback calculations when analytics API is not available
 */

/**
 * Calculate growth rate between two periods
 * @param {number} current - Current period value
 * @param {number} previous - Previous period value
 * @returns {number} Growth rate percentage
 */
export function calculateGrowthRate(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Build BCG Matrix for products
 * @param {Array} products - Array of products
 * @param {Array} sales - Array of sales
 * @returns {Object} BCG Matrix classification
 */
export function buildBCGMatrix(products, sales) {
  // Calculate product metrics
  const productMetrics = {};

  sales.forEach(sale => {
    sale.lignes?.forEach(ligne => {
      if (!productMetrics[ligne.productId]) {
        productMetrics[ligne.productId] = {
          id: ligne.productId,
          title: ligne.productTitle,
          revenue: 0,
          quantity: 0,
          growth: 0
        };
      }
      productMetrics[ligne.productId].revenue += ligne.quantity * ligne.unitPrice;
      productMetrics[ligne.productId].quantity += ligne.quantity;
    });
  });

  const metrics = Object.values(productMetrics);
  if (metrics.length === 0) return { stars: [], cashCows: [], questionMarks: [], dogs: [] };

  // Calculate medians for classification
  const revenues = metrics.map(m => m.revenue).sort((a, b) => a - b);
  const medianRevenue = revenues[Math.floor(revenues.length / 2)];

  // Simple growth simulation (in real app, compare with historical data)
  const avgGrowth = metrics.reduce((sum, m) => sum + m.quantity, 0) / metrics.length;

  // Classify products
  const bcg = { stars: [], cashCows: [], questionMarks: [], dogs: [] };

  metrics.forEach(product => {
    const highMarketShare = product.revenue > medianRevenue;
    const highGrowth = product.quantity > avgGrowth;

    if (highMarketShare && highGrowth) {
      bcg.stars.push(product);
    } else if (highMarketShare && !highGrowth) {
      bcg.cashCows.push(product);
    } else if (!highMarketShare && highGrowth) {
      bcg.questionMarks.push(product);
    } else {
      bcg.dogs.push(product);
    }
  });

  return bcg;
}

/**
 * Generate simple forecast using moving average
 * @param {Array} historicalData - Array of historical data points with {date, value}
 * @param {number} periods - Number of periods to forecast
 * @returns {Array} Forecast data
 */
export function generateForecast(historicalData, periods = 7) {
  if (!Array.isArray(historicalData) || historicalData.length < 2) {
    // Return empty forecast with placeholder dates
    return Array.from({ length: periods }, (_, i) => ({
      date: `+${i + 1}j`,
      value: 0,
      isForecast: true
    }));
  }

  const windowSize = Math.min(7, Math.max(2, Math.floor(historicalData.length / 2)));
  const forecast = [];

  // Calculate moving average safely
  const calculateMA = (data, size) => {
    const validData = data.filter(d => d && typeof d.value === 'number' && !isNaN(d.value));
    if (validData.length === 0) return 0;
    const slicedData = validData.slice(-Math.min(size, validData.length));
    const sum = slicedData.reduce((acc, val) => acc + val.value, 0);
    return slicedData.length > 0 ? sum / slicedData.length : 0;
  };

  // Generate forecast
  const lastValue = calculateMA(historicalData, windowSize);
  const firstValue = historicalData[0]?.value || 0;
  const trend = historicalData.length > 1 ? (lastValue - firstValue) / historicalData.length : 0;

  // Get last date
  let lastDate;
  try {
    const lastDateStr = historicalData[historicalData.length - 1]?.date;
    lastDate = lastDateStr ? new Date(lastDateStr) : new Date();
  } catch {
    lastDate = new Date();
  }

  for (let i = 1; i <= periods; i++) {
    const forecastValue = lastValue + (trend * i);
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      value: Math.max(0, Math.round(forecastValue * 100) / 100),
      isForecast: true
    });
  }

  return forecast;
}

/**
 * Calculate seasonality patterns from sales data
 * @param {Array} sales - Array of sales
 * @returns {Object} Seasonality data by month
 */
export function calculateSeasonality(sales) {
  const monthlyData = {};

  sales.forEach(sale => {
    const date = new Date(sale.saleDate);
    const month = date.toLocaleString('default', { month: 'short' });

    if (!monthlyData[month]) {
      monthlyData[month] = { month, revenue: 0, count: 0 };
    }

    monthlyData[month].revenue += sale.totalAmount;
    monthlyData[month].count += 1;
  });

  return Object.values(monthlyData);
}

/**
 * Build cohort analysis from customers and sales
 * @param {Array} customers - Array of customers
 * @param {Array} sales - Array of sales
 * @returns {Array} Cohort data
 */
export function buildCohortAnalysis(customers, sales) {
  // Simple cohort by month of first purchase
  const cohorts = {};

  sales.forEach(sale => {
    const date = new Date(sale.saleDate);
    const cohortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!cohorts[cohortKey]) {
      cohorts[cohortKey] = {
        cohort: cohortKey,
        users: new Set(),
        revenue: 0,
        orders: 0
      };
    }

    if (sale.userId) cohorts[cohortKey].users.add(sale.userId);
    cohorts[cohortKey].revenue += sale.totalAmount;
    cohorts[cohortKey].orders += 1;
  });

  return Object.values(cohorts).map(c => ({
    ...c,
    users: c.users.size
  }));
}

/**
 * Calculate distribution statistics
 * @param {Array} values - Array of numeric values
 * @returns {Object} Statistics (mean, median, std, quartiles)
 */
export function calculateStatistics(values) {
  if (!values || values.length === 0) {
    return { mean: 0, median: 0, std: 0, min: 0, max: 0, q1: 0, q3: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);

  const median = sorted[Math.floor(sorted.length / 2)];
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];

  return {
    mean: parseFloat(mean.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    std: parseFloat(std.toFixed(2)),
    min: parseFloat(Math.min(...values).toFixed(2)),
    max: parseFloat(Math.max(...values).toFixed(2)),
    q1: parseFloat(q1.toFixed(2)),
    q3: parseFloat(q3.toFixed(2))
  };
}

/**
 * Calculate Average Order Value
 * @param {Array} sales - Array of sales
 * @returns {number} AOV
 */
export function calculateAOV(sales) {
  if (!sales || sales.length === 0) return 0;
  const totalRevenue = sales.reduce((sum, s) => {
    const amount = parseFloat(s?.totalAmount ?? s?.total ?? s?.montant ?? 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  return totalRevenue / sales.length;
}

/**
 * Get safe sale date from various possible field names
 */
function getSaleDate(sale) {
  const dateStr = sale?.saleDate || sale?.createdAt || sale?.date || sale?.dateVente;
  try {
    if (!dateStr) return new Date();
    return new Date(dateStr);
  } catch {
    return new Date();
  }
}

/**
 * Get safe total amount from various possible field names
 */
function getSaleAmount(sale) {
  const amount = parseFloat(sale?.totalAmount ?? sale?.total ?? sale?.montant ?? sale?.amount ?? 0);
  return isNaN(amount) ? 0 : amount;
}

/**
 * Group sales by time period
 * @param {Array} sales - Array of sales
 * @param {string} period - 'hour', 'day', 'week', 'month'
 * @returns {Array} Grouped sales data with period, revenue, count
 */
export function groupSalesByPeriod(sales, period = 'day') {
  if (!Array.isArray(sales) || sales.length === 0) {
    // Return default data structure
    if (period === 'hour') {
      return Array.from({ length: 24 }, (_, i) => ({
        period: `${i}:00`,
        revenue: 0,
        count: 0
      }));
    }
    if (period === 'day') {
      return ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => ({
        period: d,
        revenue: 0,
        count: 0
      }));
    }
    if (period === 'month') {
      return ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map(m => ({
        period: m,
        revenue: 0,
        count: 0
      }));
    }
    return [];
  }

  const grouped = {};
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  sales.forEach(sale => {
    const date = getSaleDate(sale);
    const amount = getSaleAmount(sale);
    let key;

    switch (period) {
      case 'hour':
        key = `${date.getHours()}:00`;
        break;
      case 'day':
        key = dayNames[date.getDay()];
        break;
      case 'week':
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `Sem ${weekNum}`;
        break;
      case 'month':
        key = monthNames[date.getMonth()];
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = { period: key, revenue: 0, count: 0 };
    }

    grouped[key].revenue += amount;
    grouped[key].count += 1;
  });

  // Sort by logical order
  let result = Object.values(grouped);

  if (period === 'day') {
    result = dayNames.map(d => grouped[d] || { period: d, revenue: 0, count: 0 });
  } else if (period === 'month') {
    result = monthNames.map(m => grouped[m] || { period: m, revenue: 0, count: 0 }).filter(m => m.count > 0 || result.length < 6);
  } else if (period === 'hour') {
    result = result.sort((a, b) => parseInt(a.period) - parseInt(b.period));
  }

  return result;
}
