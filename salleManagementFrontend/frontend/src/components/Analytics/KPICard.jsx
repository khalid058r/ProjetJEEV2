import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/chartHelpers';

/**
 * Enhanced KPI Card Component
 * Modern design with gradients, animations, and mini sparklines
 */
const KPICard = React.memo(({ 
  title, 
  value, 
  variation = null, 
  icon: Icon,
  format = 'number',
  loading = false,
  className = '',
  color = 'blue',
  subtitle = null,
  sparklineData = null,
  target = null,
  size = 'default'
}) => {
  const positive = variation >= 0;
  const isNeutral = variation === 0;
  
  // Color configurations
  const colorConfig = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      ring: 'ring-blue-500/20',
      sparkline: '#3b82f6'
    },
    green: {
      gradient: 'from-emerald-500 to-emerald-600',
      light: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      ring: 'ring-emerald-500/20',
      sparkline: '#10b981'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      ring: 'ring-purple-500/20',
      sparkline: '#8b5cf6'
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      light: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-100',
      ring: 'ring-orange-500/20',
      sparkline: '#f97316'
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      light: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-100',
      ring: 'ring-red-500/20',
      sparkline: '#ef4444'
    },
    indigo: {
      gradient: 'from-indigo-500 to-indigo-600',
      light: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      ring: 'ring-indigo-500/20',
      sparkline: '#6366f1'
    }
  };

  const colors = colorConfig[color] || colorConfig.blue;
  
  // Format value based on type
  const formatValue = (val) => {
    if (format === 'text') return val;
    if (format === 'currency') return formatCurrency(val);
    if (format === 'percentage') return formatPercentage(val);
    if (typeof val === 'string') return val;
    return formatNumber(val);
  };

  // Mini Sparkline SVG
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const width = 60;
    const height = 24;
    
    const points = sparklineData.map((val, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="opacity-60">
        <polyline
          fill="none"
          stroke={colors.sparkline}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  // Target progress indicator
  const renderTarget = () => {
    if (!target || typeof value !== 'number') return null;
    const progress = Math.min((value / target) * 100, 100);
    const isAchieved = progress >= 100;
    
    return (
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Objectif: {formatValue(target)}</span>
          <span className={isAchieved ? 'text-green-600 font-medium' : 'text-gray-500'}>
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isAchieved ? 'bg-gradient-to-r from-green-400 to-green-500' : `bg-gradient-to-r ${colors.gradient}`
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full w-24 mb-3"></div>
              <div className="h-9 bg-gray-200 rounded-lg w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const sizeClasses = size === 'compact' ? 'p-4' : 'p-6';
  const valueSizeClass = size === 'compact' ? 'text-2xl' : 'text-3xl';

  return (
    <div className={`
      group bg-white border border-gray-100 rounded-2xl ${sizeClasses} 
      shadow-sm hover:shadow-lg hover:shadow-gray-100/50
      hover:border-gray-200 transition-all duration-300
      hover:-translate-y-0.5 relative overflow-hidden
      ${className}
    `}>
      {/* Decorative gradient blob */}
      <div className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br ${colors.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
      
      <div className="flex justify-between items-start relative">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-gray-500 text-sm font-medium truncate">{title}</p>
            {sparklineData && renderSparkline()}
          </div>
          
          <p className={`${valueSizeClass} font-bold text-gray-900 tracking-tight`}>
            {formatValue(value)}
          </p>
          
          {subtitle && (
            <p className="text-gray-400 text-xs mt-1">{subtitle}</p>
          )}

          {variation !== null && (
            <div className="flex items-center gap-2 mt-3">
              <div
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                  ${positive ? 'bg-green-50 text-green-700' : isNeutral ? 'bg-gray-50 text-gray-600' : 'bg-red-50 text-red-700'}
                `}
              >
                {positive && !isNeutral ? (
                  <ArrowUpRight size={12} />
                ) : isNeutral ? (
                  <Minus size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                <span>{positive && !isNeutral ? '+' : ''}{formatPercentage(Math.abs(variation))}</span>
              </div>
              <span className="text-gray-400 text-xs">vs période précédente</span>
            </div>
          )}
          
          {renderTarget()}
        </div>

        {Icon && (
          <div className={`
            p-3 ${colors.light} rounded-xl ${colors.text}
            group-hover:scale-110 transition-transform duration-300
            ring-1 ${colors.ring}
          `}>
            <Icon size={size === 'compact' ? 20 : 24} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
});

KPICard.displayName = 'KPICard';

export default KPICard;
