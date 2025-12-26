import React from 'react';

/**
 * Progress Ring - Circular progress indicator
 */
const ProgressRing = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  label = '',
  sublabel = '',
  showPercentage = true,
  className = ''
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Gradient ID
  const gradientId = `progress-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
            className="opacity-30"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage && (
            <span className="text-2xl font-bold text-gray-900">
              {percentage.toFixed(0)}%
            </span>
          )}
          {label && (
            <span className="text-xs text-gray-500 mt-1 text-center px-2">
              {label}
            </span>
          )}
        </div>
      </div>
      
      {sublabel && (
        <p className="text-sm text-gray-600 mt-3 font-medium text-center">
          {sublabel}
        </p>
      )}
    </div>
  );
};

/**
 * Progress Rings Container
 */
export const ProgressRingsGrid = ({ rings, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
      {rings.map((ring, index) => (
        <div key={index} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center">
          <ProgressRing {...ring} />
        </div>
      ))}
    </div>
  );
};

export default ProgressRing;
