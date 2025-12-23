import React from 'react';

/**
 * Loading Skeleton Components
 * Provides skeleton loaders for different content types
 */

export const ChartSkeleton = ({ height = '300px', className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`} style={{ height }}>
      <div className="h-full bg-gray-200 rounded-lg"></div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* Header */}
      <div className="flex gap-4 mb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-10 bg-gray-200 rounded"></div>
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 mb-3">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div key={colIdx} className="flex-1 h-8 bg-gray-100 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const KPIGridSkeleton = ({ count = 4, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse ${className}`}>
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-100 rounded w-full"></div>
        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
        <div className="h-4 bg-gray-100 rounded w-4/6"></div>
      </div>
    </div>
  );
};

const LoadingSkeleton = {
  Chart: ChartSkeleton,
  Table: TableSkeleton,
  KPIGrid: KPIGridSkeleton,
  Card: CardSkeleton
};

export default LoadingSkeleton;
