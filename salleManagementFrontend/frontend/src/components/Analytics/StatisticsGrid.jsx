import React from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Package, Users, BarChart3, Activity, Target, Award,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/chartHelpers';

/**
 * Statistics Grid - Compact grid of mini statistics
 */
const StatisticsGrid = ({ stats, className = '' }) => {
  const iconMap = {
    revenue: DollarSign,
    sales: ShoppingCart,
    products: Package,
    users: Users,
    growth: TrendingUp,
    average: BarChart3,
    activity: Activity,
    target: Target,
    award: Award
  };

  const colorMap = {
    revenue: 'from-emerald-500 to-emerald-600',
    sales: 'from-blue-500 to-blue-600',
    products: 'from-purple-500 to-purple-600',
    users: 'from-orange-500 to-orange-600',
    growth: 'from-green-500 to-green-600',
    average: 'from-indigo-500 to-indigo-600',
    activity: 'from-pink-500 to-pink-600',
    target: 'from-cyan-500 to-cyan-600',
    award: 'from-yellow-500 to-yellow-600'
  };

  const bgColorMap = {
    revenue: 'bg-emerald-50',
    sales: 'bg-blue-50',
    products: 'bg-purple-50',
    users: 'bg-orange-50',
    growth: 'bg-green-50',
    average: 'bg-indigo-50',
    activity: 'bg-pink-50',
    target: 'bg-cyan-50',
    award: 'bg-yellow-50'
  };

  const formatValue = (value, format) => {
    if (format === 'currency') return formatCurrency(value);
    if (format === 'percentage') return formatPercentage(value);
    return formatNumber(value);
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${className}`}>
      {stats.map((stat, index) => {
        const Icon = iconMap[stat.type] || Activity;
        const gradient = colorMap[stat.type] || 'from-gray-500 to-gray-600';
        const bgColor = bgColorMap[stat.type] || 'bg-gray-50';
        const isPositive = stat.change >= 0;

        return (
          <div 
            key={index}
            className="group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-lg hover:border-gray-200 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 ${bgColor} rounded-lg group-hover:scale-110 transition-transform`}>
                <Icon size={16} className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`} 
                  style={{ color: stat.type === 'revenue' ? '#10b981' : stat.type === 'sales' ? '#3b82f6' : stat.type === 'products' ? '#8b5cf6' : '#f97316' }}
                />
              </div>
              {stat.change !== undefined && (
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {formatPercentage(Math.abs(stat.change))}
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">
              {formatValue(stat.value, stat.format)}
            </p>
            <p className="text-xs text-gray-500 truncate">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export default StatisticsGrid;
