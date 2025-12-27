import { useDarkMode } from "../../context/DarkModeContext";

export default function VendeurKpiCard({ title, value, icon, trend, trendUp = true, gradient = "from-coral-500 to-coral-600" }) {
  const { darkMode } = useDarkMode();

  return (
    <div className={`
      relative overflow-hidden p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group
      ${darkMode
        ? 'bg-warm-900 border-warm-800'
        : 'bg-white border-warm-100'
      }
    `}>
      {/* Background decoration */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className={`text-sm font-medium uppercase tracking-wider ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>
            {value}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-teal-500' : 'text-coral-500'}`}>
              <span>{trendUp ? '↑' : '↓'}</span>
              <span>{trend}</span>
              <span className={`font-normal text-xs ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>vs last period</span>
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
