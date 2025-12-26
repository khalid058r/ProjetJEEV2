export default function VendeurKpiCard({ title, value, icon, trend, trendUp = true, gradient = "from-blue-500 to-cyan-500" }) {
  return (
    <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      {/* Background decoration */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              <span>{trendUp ? '↑' : '↓'}</span>
              <span>{trend}</span>
              <span className="text-gray-400 font-normal text-xs">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
