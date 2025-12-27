import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { useDarkMode } from "../../context/DarkModeContext";

export default function VendeurSalesChart({ data = [] }) {
  const { darkMode } = useDarkMode();

  return (
    <div className={`p-6 rounded-2xl shadow-lg border ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'
      }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-coral-500 to-coral-600 rounded-xl shadow-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-warm-900'}`}>Daily Sales</h3>
            <p className={`text-xs ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Revenue over time</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${darkMode ? 'text-warm-400 bg-warm-800' : 'text-warm-500 bg-warm-50'
          }`}>
          <Calendar className="w-4 h-4" />
          <span>Last 7 days</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className={`flex flex-col items-center justify-center h-64 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>
          <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No sales data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#3f3f46' : '#f0f0f0'} />
            <XAxis
              dataKey="date"
              tick={{ fill: darkMode ? '#a1a1aa' : '#6B7280', fontSize: 12 }}
              tickFormatter={(val) => {
                if (!val) return '';
                const date = new Date(val);
                return date.toLocaleDateString('en', { weekday: 'short' });
              }}
            />
            <YAxis tick={{ fill: darkMode ? '#a1a1aa' : '#6B7280', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#27272a' : 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                color: darkMode ? '#fff' : '#1f2937'
              }}
              formatter={(value) => [`$${(value || 0).toFixed(2)}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#FF5A5F"
              strokeWidth={3}
              fill="url(#colorTotal)"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#FF5A5F"
              strokeWidth={3}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
