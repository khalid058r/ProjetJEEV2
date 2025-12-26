import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Tag,
  AlertTriangle,
  Award,
  BarChart3,
  PieChart,
} from "lucide-react";

// Icon mapping
const ICONS = {
  revenue: DollarSign,
  sales: ShoppingCart,
  products: Package,
  users: Users,
  categories: Tag,
  alerts: AlertTriangle,
  top: Award,
  analytics: BarChart3,
  distribution: PieChart,
  trending: TrendingUp,
};

// Color variants
const COLORS = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    icon: "text-blue-500",
    border: "border-blue-100 dark:border-blue-800",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    icon: "text-green-500",
    border: "border-green-100 dark:border-green-800",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
    icon: "text-purple-500",
    border: "border-purple-100 dark:border-purple-800",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
    icon: "text-orange-500",
    border: "border-orange-100 dark:border-orange-800",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    icon: "text-red-500",
    border: "border-red-100 dark:border-red-800",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-600 dark:text-indigo-400",
    icon: "text-indigo-500",
    border: "border-indigo-100 dark:border-indigo-800",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    text: "text-cyan-600 dark:text-cyan-400",
    icon: "text-cyan-500",
    border: "border-cyan-100 dark:border-cyan-800",
  },
};

export default function KpiCard({
  title,
  value,
  subtitle,
  icon = "analytics",
  color = "blue",
  trend = null, // { value: number, isPositive: boolean }
  loading = false,
  className = "",
  onClick,
}) {
  const colorClasses = COLORS[color] || COLORS.blue;
  const IconComponent = ICONS[icon] || BarChart3;

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 ${className}`}>
        <div className="animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
          <div className="h-8 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
          <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : {}}
      onClick={onClick}
      className={`
        bg-white dark:bg-slate-800 rounded-2xl p-6 
        shadow-sm hover:shadow-lg transition-all duration-300
        border border-gray-100 dark:border-slate-700
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <div className={`p-3 rounded-xl ${colorClasses.bg}`}>
          <IconComponent className={`w-5 h-5 ${colorClasses.icon}`} />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-3">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {value}
        </h3>

        {/* Trend indicator */}
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend.isPositive
                ? "text-green-600 dark:text-green-400"
                : trend.value === 0
                ? "text-gray-500 dark:text-gray-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : trend.value === 0 ? (
              <Minus className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

// Compact KPI card variant
export function KpiCardCompact({ title, value, icon = "analytics", color = "blue", className = "" }) {
  const colorClasses = COLORS[color] || COLORS.blue;
  const IconComponent = ICONS[icon] || BarChart3;

  return (
    <div className={`flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 ${className}`}>
      <div className={`p-2.5 rounded-lg ${colorClasses.bg}`}>
        <IconComponent className={`w-5 h-5 ${colorClasses.icon}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

// Large KPI card for featured stats
export function KpiCardLarge({
  title,
  value,
  subtitle,
  description,
  icon = "analytics",
  color = "blue",
  trend,
  className = "",
}) {
  const colorClasses = COLORS[color] || COLORS.blue;
  const IconComponent = ICONS[icon] || BarChart3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-gradient-to-br from-${color}-500 to-${color}-600 
        dark:from-${color}-600 dark:to-${color}-700
        rounded-2xl p-6 text-white shadow-lg
        ${className}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
          <IconComponent className="w-6 h-6" />
        </div>
      </div>

      <h3 className="text-4xl font-bold mb-2">{value}</h3>

      {description && (
        <p className="text-sm opacity-90">{description}</p>
      )}

      {trend && (
        <div className="flex items-center gap-2 mt-4 text-sm">
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}% vs période précédente
          </span>
        </div>
      )}
    </motion.div>
  );
}
