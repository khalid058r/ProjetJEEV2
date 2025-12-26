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

export default function VendeurSalesChart({ data = [] }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Daily Sales</h3>
            <p className="text-xs text-gray-500">Revenue over time</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
          <Calendar className="w-4 h-4" />
          <span>Last 7 days</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No sales data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(val) => {
                if (!val) return '';
                const date = new Date(val);
                return date.toLocaleDateString('en', { weekday: 'short' });
              }}
            />
            <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}
              formatter={(value) => [`$${(value || 0).toFixed(2)}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="url(#colorTotal)"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
