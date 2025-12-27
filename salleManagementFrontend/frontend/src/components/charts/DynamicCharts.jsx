/**
 * Airbnb-Inspired Dynamic Chart Components
 * Reusable, responsive, and theme-aware chart components
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Scatter,
  ScatterChart,
  Treemap,
} from 'recharts';
import { useDarkMode } from '../../context/DarkModeContext';
import { TrendingUp, TrendingDown, Minus, Maximize2, Download, RefreshCw } from 'lucide-react';

// Chart color palettes
const CHART_COLORS = {
  light: ['#FF5A5F', '#00A699', '#FC642D', '#FFB400', '#914669', '#428BFF', '#7B61FF', '#00C49F'],
  dark: ['#FF7A7F', '#00D1C0', '#FF9B4A', '#FFD166', '#B98EFF', '#64A9FF', '#A78BFF', '#00E5CC'],
};

// Get theme-aware colors
export const useChartColors = () => {
  const { isDark } = useDarkMode();
  return isDark ? CHART_COLORS.dark : CHART_COLORS.light;
};

// Format utilities
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat('fr-FR').format(value || 0);
};

export const formatPercent = (value) => {
  return `${(value * 100).toFixed(1)}%`;
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, isDark, formatValue = formatCurrency }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className={`p-3 rounded-xl shadow-lg border ${
        isDark
          ? 'bg-warm-900 border-warm-700 text-white'
          : 'bg-white border-warm-200 text-warm-900'
      }`}
    >
      <p className="font-medium text-sm mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className={isDark ? 'text-warm-400' : 'text-warm-600'}>
            {entry.name}:
          </span>
          <span className="font-semibold">
            {typeof entry.value === 'number' ? formatValue(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Chart Card Wrapper
export const ChartCard = ({ 
  title, 
  subtitle, 
  children, 
  actions = [], 
  loading = false,
  onRefresh,
  onFullscreen,
  onDownload,
  className = ''
}) => {
  const { isDark } = useDarkMode();

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 hover:shadow-lg ${
        isDark
          ? 'bg-warm-900 border-warm-800'
          : 'bg-white border-warm-200'
      } ${className}`}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDark ? 'border-warm-800' : 'border-warm-100'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-warm-900'}`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`text-sm mt-0.5 ${isDark ? 'text-warm-400' : 'text-warm-500'}`}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-warm-800 text-warm-400'
                    : 'hover:bg-warm-100 text-warm-500'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            {onDownload && (
              <button
                onClick={onDownload}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-warm-800 text-warm-400'
                    : 'hover:bg-warm-100 text-warm-500'
                }`}
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onFullscreen && (
              <button
                onClick={onFullscreen}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-warm-800 text-warm-400'
                    : 'hover:bg-warm-100 text-warm-500'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            {actions}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-coral-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

// ==================== AREA CHART ====================
export const DynamicAreaChart = ({
  data = [],
  dataKeys = [{ key: 'value', name: 'Value', color: '#FF5A5F' }],
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  formatXAxis,
  formatYAxis = formatNumber,
  gradient = true,
}) => {
  const { isDark } = useDarkMode();
  const colors = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {dataKeys.map((dk, i) => (
            <linearGradient key={dk.key} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={dk.color || colors[i]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={dk.color || colors[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? '#333333' : '#EBEBEB'}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 12, fill: isDark ? '#B3B3B3' : '#717171' }}
          tickFormatter={formatXAxis}
          axisLine={{ stroke: isDark ? '#333333' : '#DDDDDD' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: isDark ? '#B3B3B3' : '#717171' }}
          tickFormatter={formatYAxis}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => (
              <span className={isDark ? 'text-warm-300' : 'text-warm-700'}>{value}</span>
            )}
          />
        )}
        {dataKeys.map((dk, i) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.name}
            stroke={dk.color || colors[i]}
            fill={gradient ? `url(#gradient-${dk.key})` : dk.color || colors[i]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ==================== BAR CHART ====================
export const DynamicBarChart = ({
  data = [],
  dataKeys = [{ key: 'value', name: 'Value' }],
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  horizontal = false,
  stacked = false,
  formatXAxis,
  formatYAxis = formatNumber,
  barRadius = 4,
}) => {
  const { isDark } = useDarkMode();
  const colors = useChartColors();

  const ChartComponent = horizontal ? BarChart : BarChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? '#333333' : '#EBEBEB'}
            horizontal={!horizontal}
            vertical={horizontal}
          />
        )}
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12, fill: isDark ? '#B3B3B3' : '#717171' }} />
            <YAxis
              dataKey={xAxisKey}
              type="category"
              tick={{ fontSize: 12, fill: isDark ? '#B3B3B3' : '#717171' }}
              width={100}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12, fill: isDark ? '#B3B3B3' : '#717171' }}
              tickFormatter={formatXAxis}
              axisLine={{ stroke: isDark ? '#333333' : '#DDDDDD' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: isDark ? '#B3B3B3' : '#717171' }}
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              width={60}
            />
          </>
        )}
        <Tooltip content={<CustomTooltip isDark={isDark} />} />
        {showLegend && <Legend wrapperStyle={{ paddingTop: 20 }} />}
        {dataKeys.map((dk, i) => (
          <Bar
            key={dk.key}
            dataKey={dk.key}
            name={dk.name}
            fill={dk.color || colors[i]}
            stackId={stacked ? 'stack' : undefined}
            radius={[barRadius, barRadius, 0, 0]}
          />
        ))}
      </ChartComponent>
    </ResponsiveContainer>
  );
};

// ==================== PIE CHART ====================
export const DynamicPieChart = ({
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  height = 300,
  innerRadius = 0,
  outerRadius = 80,
  showLabels = true,
  showLegend = true,
}) => {
  const { isDark } = useDarkMode();
  const colors = useChartColors();

  const renderLabel = ({ name, percent }) => {
    if (!showLabels || percent < 0.05) return null;
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          label={showLabels ? renderLabel : false}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || colors[index % colors.length]}
              stroke={isDark ? '#1A1A1A' : '#FFFFFF'}
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip isDark={isDark} />} />
        {showLegend && (
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => (
              <span className={`text-sm ${isDark ? 'text-warm-300' : 'text-warm-700'}`}>
                {value}
              </span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};

// ==================== DONUT CHART ====================
export const DynamicDonutChart = ({ data = [], ...props }) => {
  return <DynamicPieChart data={data} innerRadius={60} {...props} />;
};

// ==================== LINE CHART ====================
export const DynamicLineChart = ({
  data = [],
  dataKeys = [{ key: 'value', name: 'Value' }],
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  showDots = true,
  formatXAxis,
  formatYAxis = formatNumber,
}) => {
  const { isDark } = useDarkMode();
  const colors = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? '#333333' : '#EBEBEB'}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 12, fill: isDark ? '#B3B3B3' : '#717171' }}
          tickFormatter={formatXAxis}
          axisLine={{ stroke: isDark ? '#333333' : '#DDDDDD' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: isDark ? '#B3B3B3' : '#717171' }}
          tickFormatter={formatYAxis}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} />
        {showLegend && <Legend wrapperStyle={{ paddingTop: 20 }} />}
        {dataKeys.map((dk, i) => (
          <Line
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.name}
            stroke={dk.color || colors[i]}
            strokeWidth={2}
            dot={showDots ? { fill: dk.color || colors[i], strokeWidth: 2, r: 4 } : false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

// ==================== COMPOSED CHART ====================
export const DynamicComposedChart = ({
  data = [],
  areaKeys = [],
  barKeys = [],
  lineKeys = [],
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
}) => {
  const { isDark } = useDarkMode();
  const colors = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333333' : '#EBEBEB'} />
        )}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 12, fill: isDark ? '#B3B3B3' : '#717171' }}
        />
        <YAxis tick={{ fontSize: 12, fill: isDark ? '#B3B3B3' : '#717171' }} />
        <Tooltip content={<CustomTooltip isDark={isDark} />} />
        {showLegend && <Legend />}
        {areaKeys.map((dk, i) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.name}
            fill={dk.color || colors[i]}
            stroke={dk.color || colors[i]}
            fillOpacity={0.3}
          />
        ))}
        {barKeys.map((dk, i) => (
          <Bar
            key={dk.key}
            dataKey={dk.key}
            name={dk.name}
            fill={dk.color || colors[areaKeys.length + i]}
            radius={[4, 4, 0, 0]}
          />
        ))}
        {lineKeys.map((dk, i) => (
          <Line
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.name}
            stroke={dk.color || colors[areaKeys.length + barKeys.length + i]}
            strokeWidth={2}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// ==================== KPI CARD ====================
export const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'coral',
  onClick,
}) => {
  const { isDark } = useDarkMode();

  const colorClasses = {
    coral: isDark ? 'bg-coral-500/20 text-coral-400' : 'bg-coral-50 text-coral-600',
    teal: isDark ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-600',
    blue: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600',
    orange: isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600',
    purple: isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColorClass =
    trend === 'up'
      ? 'text-teal-500'
      : trend === 'down'
      ? 'text-coral-500'
      : isDark
      ? 'text-warm-400'
      : 'text-warm-500';

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
        isDark ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-200'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColorClass}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-warm-900'}`}>
        {value}
      </div>
      <div className={`text-sm ${isDark ? 'text-warm-400' : 'text-warm-500'}`}>{title}</div>
      {subtitle && (
        <div className={`text-xs mt-2 ${isDark ? 'text-warm-500' : 'text-warm-400'}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

// ==================== RADIAL PROGRESS ====================
export const RadialProgress = ({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 12,
  color = '#FF5A5F',
  label,
  sublabel,
}) => {
  const { isDark } = useDarkMode();
  const percentage = (value / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isDark ? '#333333' : '#EBEBEB'}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-warm-900'}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      {label && (
        <div className={`mt-3 text-center ${isDark ? 'text-warm-300' : 'text-warm-700'}`}>
          {label}
        </div>
      )}
      {sublabel && (
        <div className={`text-sm ${isDark ? 'text-warm-500' : 'text-warm-500'}`}>{sublabel}</div>
      )}
    </div>
  );
};

// ==================== SPARKLINE ====================
export const Sparkline = ({ data = [], color = '#FF5A5F', height = 40, showArea = true }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        {showArea && (
          <defs>
            <linearGradient id={`spark-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={showArea ? `url(#spark-gradient-${color})` : 'transparent'}
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default {
  ChartCard,
  DynamicAreaChart,
  DynamicBarChart,
  DynamicPieChart,
  DynamicDonutChart,
  DynamicLineChart,
  DynamicComposedChart,
  KpiCard,
  RadialProgress,
  Sparkline,
  useChartColors,
  formatCurrency,
  formatNumber,
  formatPercent,
};
