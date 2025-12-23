import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Date Range Picker Component
 * Provides quick filters and custom date range selection
 */
const DateRangePicker = ({ onRangeChange, className = '' }) => {
  const [selectedRange, setSelectedRange] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const presets = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'Custom', value: 'custom' }
  ];

  const handlePresetClick = (value) => {
    setSelectedRange(value);
    setShowCustom(value === 'custom');

    if (value !== 'custom') {
      const end = endOfDay(new Date());
      let start;

      switch (value) {
        case 'today':
          start = startOfDay(new Date());
          break;
        case '7d':
          start = startOfDay(subDays(new Date(), 7));
          break;
        case '30d':
          start = startOfDay(subDays(new Date(), 30));
          break;
        case '90d':
          start = startOfDay(subDays(new Date(), 90));
          break;
        default:
          start = startOfDay(subDays(new Date(), 30));
      }

      if (onRangeChange) {
        onRangeChange({ start, end, label: value });
      }
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = startOfDay(new Date(customStart));
      const end = endOfDay(new Date(customEnd));

      if (start <= end && onRangeChange) {
        onRangeChange({ start, end, label: 'custom' });
      }
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={18} className="text-gray-600" />
        <span className="text-sm font-semibold text-gray-700">Date Range</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedRange === preset.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Apply Custom Range
          </button>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
