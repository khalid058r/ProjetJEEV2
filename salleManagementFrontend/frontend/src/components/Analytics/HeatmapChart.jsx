import React from 'react';
import { formatCurrency } from '../../utils/chartHelpers';

/**
 * Heatmap Chart Component - Weekly/Hourly sales visualization
 */
const HeatmapChart = ({ 
  data, 
  title = 'Heatmap des Ventes',
  className = '',
  showLabels = true,
  colorScheme = 'blue' // blue, green, purple, orange
}) => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Find max value for scaling
  const maxValue = Math.max(...data.flat().map(v => v || 0));

  // Color schemes
  const schemes = {
    blue: {
      low: 'rgba(59, 130, 246, 0.1)',
      high: 'rgba(59, 130, 246, 1)',
      rgb: [59, 130, 246]
    },
    green: {
      low: 'rgba(16, 185, 129, 0.1)',
      high: 'rgba(16, 185, 129, 1)',
      rgb: [16, 185, 129]
    },
    purple: {
      low: 'rgba(139, 92, 246, 0.1)',
      high: 'rgba(139, 92, 246, 1)',
      rgb: [139, 92, 246]
    },
    orange: {
      low: 'rgba(249, 115, 22, 0.1)',
      high: 'rgba(249, 115, 22, 1)',
      rgb: [249, 115, 22]
    }
  };

  const scheme = schemes[colorScheme] || schemes.blue;

  // Calculate cell color based on value
  const getCellColor = (value) => {
    if (!value || maxValue === 0) return scheme.low;
    const intensity = value / maxValue;
    const [r, g, b] = scheme.rgb;
    return `rgba(${r}, ${g}, ${b}, ${0.1 + intensity * 0.9})`;
  };

  // Get text color for cell (white if dark background)
  const getTextColor = (value) => {
    if (!value || maxValue === 0) return 'text-gray-400';
    const intensity = value / maxValue;
    return intensity > 0.5 ? 'text-white' : 'text-gray-700';
  };

  return (
    <div className={`bg-white border border-gray-100 rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Hour labels */}
          {showLabels && (
            <div className="flex ml-12 mb-2">
              {hours.filter((_, i) => i % 2 === 0).map(hour => (
                <div key={hour} className="flex-1 text-center">
                  <span className="text-xs text-gray-400">{`${hour}h`}</span>
                </div>
              ))}
            </div>
          )}

          {/* Grid */}
          <div className="space-y-1">
            {days.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-2">
                {showLabels && (
                  <span className="w-10 text-xs text-gray-500 font-medium">{day}</span>
                )}
                <div className="flex-1 flex gap-0.5">
                  {hours.map(hour => {
                    const value = data[dayIndex]?.[hour] || 0;
                    return (
                      <div
                        key={hour}
                        className={`
                          flex-1 h-8 rounded-sm transition-all duration-200
                          hover:scale-110 hover:z-10 cursor-pointer
                          flex items-center justify-center
                          group relative
                        `}
                        style={{ backgroundColor: getCellColor(value) }}
                      >
                        {/* Tooltip */}
                        <div className="
                          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                          px-3 py-2 bg-gray-900 text-white text-xs rounded-lg
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible
                          transition-all whitespace-nowrap z-20 shadow-lg
                        ">
                          <p className="font-medium">{day} {hour}:00</p>
                          <p className="text-gray-300">{formatCurrency(value)}</p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-4 mt-6">
            <span className="text-xs text-gray-500">Faible</span>
            <div className="flex gap-0.5">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, i) => (
                <div
                  key={i}
                  className="w-8 h-3 rounded-sm"
                  style={{ 
                    backgroundColor: `rgba(${scheme.rgb.join(',')}, ${intensity})` 
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">Élevé</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
