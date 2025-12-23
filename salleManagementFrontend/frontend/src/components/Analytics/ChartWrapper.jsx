import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Chart Wrapper Component
 * Provides consistent container with loading and error states
 */
const ChartWrapper = ({ 
  title, 
  subtitle = null,
  children, 
  loading = false, 
  error = null,
  actions = null,
  className = '',
  height = 'auto'
}) => {
  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="flex items-center justify-center" style={{ height: height === 'auto' ? '300px' : height }}>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}>
        <h2 className="text-lg font-semibold mb-2 text-gray-900">{title}</h2>
        <div className="flex items-center justify-center" style={{ height: height === 'auto' ? '300px' : height }}>
          <div className="text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-gray-700 font-medium">Error loading chart</p>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div style={{ height: height === 'auto' ? 'auto' : height }}>
        {children}
      </div>
    </div>
  );
};

export default ChartWrapper;
