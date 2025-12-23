import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/chartHelpers';

/**
 * KPI Card Component
 * Displays a key performance indicator with icon, value, and trend
 */
const KPICard = React.memo(({ 
  title, 
  value, 
  variation = null, 
  icon: Icon,
  format = 'number',
  loading = false,
  className = ''
}) => {
  const positive = variation >= 0;
  
  // Format value based on type
  const formatValue = (val) => {
    if (format === 'text') return val; // Return text as-is
    if (format === 'currency') return formatCurrency(val);
    if (format === 'percentage') return formatPercentage(val);
    if (typeof val === 'string') return val; // Handle string values
    return formatNumber(val);
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1 text-gray-900">
            {formatValue(value)}
          </p>

          {variation !== null && (
            <div
              className={`flex items-center gap-1 text-sm font-semibold mt-2 ${
                positive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {positive ? (
                <TrendingUp size={16} className="animate-pulse" />
              ) : (
                <TrendingDown size={16} className="animate-pulse" />
              )}
              <span>
                {positive ? '+' : ''}{formatPercentage(variation)}
              </span>
              <span className="text-gray-500 text-xs font-normal ml-1">vs last period</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors duration-200">
            <Icon size={28} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
});

KPICard.displayName = 'KPICard';

export default KPICard;
