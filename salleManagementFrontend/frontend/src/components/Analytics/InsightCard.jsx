import React from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';

/**
 * Insight Card Component
 * Displays smart insights and recommendations
 */
const InsightCard = ({ 
  type = 'info', 
  title, 
  message, 
  action = null,
  className = '' 
}) => {
  const configs = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-900'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900'
    },
    danger: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-900'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900'
    },
    insight: {
      icon: Lightbulb,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-900'
    },
    trend: {
      icon: TrendingUp,
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      iconColor: 'text-indigo-600',
      textColor: 'text-indigo-900'
    }
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div 
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className} hover:shadow-md transition-shadow duration-200`}
    >
      <div className="flex items-start gap-3">
        <div className={`${config.iconColor} mt-0.5`}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-sm ${config.textColor} mb-1`}>
            {title}
          </h3>
          <p className={`text-sm ${config.textColor} opacity-90`}>
            {message}
          </p>
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-3 text-sm font-medium ${config.iconColor} hover:underline`}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Insights Container Component
 * Groups multiple insight cards
 */
export const InsightsContainer = ({ title = 'Smart Insights', children, className = '' }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="text-yellow-500" size={24} />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

export default InsightCard;
