/**
 * Chart Helper Utilities
 * Common functions for chart customization and formatting
 */

// Google Analytics inspired color palette
export const GA_COLORS = {
  blue: '#4285f4',
  blueLight: '#e8f0fe',
  blueDark: '#1a73e8',
  green: '#34a853',
  greenLight: '#e6f4ea',
  yellow: '#fbbc05',
  yellowLight: '#fef7e0',
  red: '#ea4335',
  redLight: '#fce8e6',
  purple: '#9334e9',
  orange: '#ff6d00',
  gray: '#5f6368',
  grayLight: '#f1f3f4'
};

export const CHART_COLORS = [
  GA_COLORS.blue,
  GA_COLORS.green,
  GA_COLORS.yellow,
  GA_COLORS.red,
  GA_COLORS.purple,
  GA_COLORS.orange
];

/**
 * Format currency values
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || typeof value !== 'number') return '0.00 DH';
  if (isNaN(value)) return '0.00 DH';
  return `${value.toFixed(2)} DH`;
}

/**
 * Format large numbers with K/M suffix
 * @param {number} value - Numeric value
 * @returns {string} Formatted number
 */
export function formatNumber(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Format percentage
 * @param {number} value - Numeric value
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value) {
  if (typeof value !== 'number') return '0%';
  return `${value.toFixed(1)}%`;
}

/**
 * Get color based on value (positive/negative)
 * @param {number} value - Numeric value
 * @returns {string} Color code
 */
export function getColorByValue(value) {
  if (value > 0) return GA_COLORS.green;
  if (value < 0) return GA_COLORS.red;
  return GA_COLORS.gray;
}

/**
 * Custom tooltip formatter for Recharts
 * @param {number} value - Value to format
 * @param {string} name - Data key name
 * @returns {Array} Formatted [value, name]
 */
export function customTooltipFormatter(value, name) {
  if (name.toLowerCase().includes('revenue') || name.toLowerCase().includes('amount')) {
    return [formatCurrency(value), name];
  }
  if (name.toLowerCase().includes('percent') || name.toLowerCase().includes('rate')) {
    return [formatPercentage(value), name];
  }
  return [formatNumber(value), name];
}

/**
 * Generate gradient definition for area charts
 * @param {string} id - Gradient ID
 * @param {string} color - Base color
 * @returns {Object} Gradient definition
 */
export function createGradient(id, color) {
  return {
    id,
    x1: '0',
    y1: '0',
    x2: '0',
    y2: '1',
    stops: [
      { offset: '0%', stopColor: color, stopOpacity: 0.3 },
      { offset: '100%', stopColor: color, stopOpacity: 0 }
    ]
  };
}

/**
 * Get heat intensity color
 * @param {number} value - Current value
 * @param {number} max - Maximum value
 * @param {string} baseColor - Base color (default: blue)
 * @returns {string} RGBA color
 */
export function getHeatColor(value, max, baseColor = 'blue') {
  const intensity = max ? value / max : 0;
  
  const colors = {
    blue: [66, 133, 244],
    green: [52, 168, 83],
    red: [234, 67, 53],
    yellow: [251, 188, 5]
  };
  
  const rgb = colors[baseColor] || colors.blue;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.15 + intensity * 0.85})`;
}

/**
 * Sort data by field
 * @param {Array} data - Data array
 * @param {string} field - Field to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted data
 */
export function sortData(data, field, direction = 'desc') {
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });
}

/**
 * Filter data by date range
 * @param {Array} data - Data array
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} dateField - Date field name
 * @returns {Array} Filtered data
 */
export function filterByDateRange(data, startDate, endDate, dateField = 'date') {
  if (!startDate || !endDate) return data;
  
  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

/**
 * Custom label for pie charts
 * @param {Object} entry - Data entry
 * @returns {string} Label text
 */
export function renderCustomPieLabel({ name, percent }) {
  return `${name}: ${(percent * 100).toFixed(0)}%`;
}

/**
 * Get BCG quadrant color
 * @param {string} quadrant - Quadrant name
 * @returns {string} Color code
 */
export function getBCGColor(quadrant) {
  const colors = {
    stars: GA_COLORS.green,
    cashCows: GA_COLORS.blue,
    questionMarks: GA_COLORS.yellow,
    dogs: GA_COLORS.red
  };
  return colors[quadrant] || GA_COLORS.gray;
}
