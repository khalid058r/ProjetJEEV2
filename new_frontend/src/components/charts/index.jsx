import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'
import { useTheme } from '../../context/ThemeContext'

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16']

// Custom Tooltip
const CustomTooltip = ({ active, payload, label, formatter }) => {
    const { darkMode } = useTheme()

    if (active && payload && payload.length) {
        return (
            <div className={`p-3 rounded-xl shadow-lg border ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
                }`}>
                <p className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-dark-900'}`}>
                    {label}
                </p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {formatter ? formatter(entry.value) : entry.value}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

// Area Chart Component
export function AreaChartComponent({
    data,
    dataKey,
    xAxisKey = 'name',
    color = '#6366F1',
    gradientId = 'colorGradient',
    height = 300,
    formatter,
    showGrid = true,
    showLegend = false,
}) {
    const { darkMode } = useTheme()

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {showGrid && (
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E5E7EB'} />
                )}
                <XAxis
                    dataKey={xAxisKey}
                    stroke={darkMode ? '#94A3B8' : '#6B7280'}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    stroke={darkMode ? '#94A3B8' : '#6B7280'}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatter}
                />
                <Tooltip content={<CustomTooltip formatter={formatter} />} />
                {showLegend && <Legend />}
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// Bar Chart Component
export function BarChartComponent({
    data,
    dataKey,
    xAxisKey = 'name',
    color = '#6366F1',
    height = 300,
    formatter,
    showGrid = true,
    showLegend = false,
    horizontal = false,
    barSize = 40,
}) {
    const { darkMode } = useTheme()

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                layout={horizontal ? 'vertical' : 'horizontal'}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
                {showGrid && (
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E5E7EB'} />
                )}
                {horizontal ? (
                    <>
                        <XAxis type="number" stroke={darkMode ? '#94A3B8' : '#6B7280'} tick={{ fontSize: 12 }} />
                        <YAxis dataKey={xAxisKey} type="category" stroke={darkMode ? '#94A3B8' : '#6B7280'} tick={{ fontSize: 12 }} width={100} />
                    </>
                ) : (
                    <>
                        <XAxis dataKey={xAxisKey} stroke={darkMode ? '#94A3B8' : '#6B7280'} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke={darkMode ? '#94A3B8' : '#6B7280'} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatter} />
                    </>
                )}
                <Tooltip content={<CustomTooltip formatter={formatter} />} />
                {showLegend && <Legend />}
                <Bar
                    dataKey={dataKey}
                    fill={color}
                    radius={[4, 4, 0, 0]}
                    barSize={barSize}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}

// Multi Bar Chart Component
export function MultiBarChartComponent({
    data,
    bars = [],
    xAxisKey = 'name',
    height = 300,
    formatter,
    showGrid = true,
    showLegend = true,
}) {
    const { darkMode } = useTheme()

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                {showGrid && (
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E5E7EB'} />
                )}
                <XAxis dataKey={xAxisKey} stroke={darkMode ? '#94A3B8' : '#6B7280'} tick={{ fontSize: 12 }} />
                <YAxis stroke={darkMode ? '#94A3B8' : '#6B7280'} tick={{ fontSize: 12 }} tickFormatter={formatter} />
                <Tooltip content={<CustomTooltip formatter={formatter} />} />
                {showLegend && <Legend />}
                {bars.map((bar, index) => (
                    <Bar
                        key={bar.dataKey}
                        dataKey={bar.dataKey}
                        name={bar.name}
                        fill={bar.color || COLORS[index % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    )
}

// Line Chart Component
export function LineChartComponent({
    data,
    lines = [],
    xAxisKey = 'name',
    height = 300,
    formatter,
    showGrid = true,
    showLegend = true,
    showDots = true,
}) {
    const { darkMode } = useTheme()

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                {showGrid && (
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E5E7EB'} />
                )}
                <XAxis dataKey={xAxisKey} stroke={darkMode ? '#94A3B8' : '#6B7280'} tick={{ fontSize: 12 }} />
                <YAxis stroke={darkMode ? '#94A3B8' : '#6B7280'} tick={{ fontSize: 12 }} tickFormatter={formatter} />
                <Tooltip content={<CustomTooltip formatter={formatter} />} />
                {showLegend && <Legend />}
                {lines.map((line, index) => (
                    <Line
                        key={line.dataKey}
                        type="monotone"
                        dataKey={line.dataKey}
                        name={line.name}
                        stroke={line.color || COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={showDots}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    )
}

// Pie Chart Component
export function PieChartComponent({
    data,
    dataKey = 'value',
    nameKey = 'name',
    height = 300,
    innerRadius = 60,
    outerRadius = 100,
    showLegend = true,
    colors = COLORS,
}) {
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
                    paddingAngle={2}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
                <Tooltip />
                {showLegend && <Legend />}
            </PieChart>
        </ResponsiveContainer>
    )
}

// Mini Sparkline
export function Sparkline({ data, dataKey, color = '#6366F1', height = 50 }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    fill="url(#sparklineGradient)"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

export default {
    AreaChartComponent,
    BarChartComponent,
    MultiBarChartComponent,
    LineChartComponent,
    PieChartComponent,
    Sparkline,
    COLORS,
}
