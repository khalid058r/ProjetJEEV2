import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/chartHelpers';

/**
 * Metric Comparison Card - Displays current vs previous period comparison
 */
const MetricComparisonCard = ({
  title,
  currentValue,
  previousValue,
  format = 'number',
  icon: Icon = Activity,
  className = ''
}) => {
  const formatValue = (val) => {
    if (format === 'currency') return formatCurrency(val);
    if (format === 'percentage') return formatPercentage(val);
    return formatNumber(val);
  };

  const change = previousValue !== 0 
    ? ((currentValue - previousValue) / previousValue) * 100 
    : 0;
  
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <Icon size={20} className="text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-600">{title}</span>
        </div>
        <div className={`
          flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
          ${isPositive ? 'bg-green-50 text-green-600' : isNeutral ? 'bg-gray-50 text-gray-500' : 'bg-red-50 text-red-600'}
        `}>
          {isPositive ? <ArrowUpRight size={12} /> : isNeutral ? <Minus size={12} /> : <ArrowDownRight size={12} />}
          {formatPercentage(Math.abs(change))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Période actuelle</p>
          <p className="text-xl font-bold text-gray-900">{formatValue(currentValue)}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Période précédente</p>
          <p className="text-lg font-semibold text-gray-600">{formatValue(previousValue)}</p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              isPositive ? 'bg-gradient-to-r from-green-400 to-green-500' : 
              isNeutral ? 'bg-gray-300' : 
              'bg-gradient-to-r from-red-400 to-red-500'
            }`}
            style={{ 
              width: `${Math.min(Math.abs(change), 100)}%`
            }}
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {isPositive ? 'En hausse' : isNeutral ? 'Stable' : 'En baisse'}
        </span>
      </div>
    </div>
  );
};

export default MetricComparisonCard;
