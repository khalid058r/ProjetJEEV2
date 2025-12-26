import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, Activity } from 'lucide-react';

/**
 * Trend Badge Component - Shows trend direction with styling
 */
const TrendBadge = ({ 
  value, 
  size = 'md',
  showIcon = true,
  showValue = true,
  inverted = false, // For metrics where down is good (like bounce rate)
  className = '' 
}) => {
  const isPositive = inverted ? value < 0 : value > 0;
  const isNeutral = value === 0;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };

  const colorClasses = isPositive 
    ? 'bg-green-50 text-green-700 border-green-100' 
    : isNeutral 
      ? 'bg-gray-50 text-gray-600 border-gray-100'
      : 'bg-red-50 text-red-700 border-red-100';

  const Icon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;

  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full font-semibold border
      ${sizeClasses[size]}
      ${colorClasses}
      ${className}
    `}>
      {showIcon && <Icon size={iconSizes[size]} />}
      {showValue && (
        <span>
          {value > 0 ? '+' : ''}{value.toFixed(1)}%
        </span>
      )}
    </span>
  );
};

/**
 * Trend Indicator - Minimal arrow indicator
 */
export const TrendIndicator = ({ value, size = 16, className = '' }) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  if (isNeutral) {
    return <Minus size={size} className={`text-gray-400 ${className}`} />;
  }

  return isPositive ? (
    <ArrowUp size={size} className={`text-green-500 ${className}`} />
  ) : (
    <ArrowDown size={size} className={`text-red-500 ${className}`} />
  );
};

/**
 * Animated Trend Pulse - Shows trend with animation
 */
export const TrendPulse = ({ positive, className = '' }) => {
  return (
    <span className={`relative flex h-3 w-3 ${className}`}>
      <span className={`
        animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
        ${positive ? 'bg-green-400' : 'bg-red-400'}
      `}></span>
      <span className={`
        relative inline-flex rounded-full h-3 w-3
        ${positive ? 'bg-green-500' : 'bg-red-500'}
      `}></span>
    </span>
  );
};

export default TrendBadge;
