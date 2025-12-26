import { motion } from "framer-motion";
import { ChartSkeleton } from "../common/LoadingScreen";

export default function ChartCard({
  title,
  subtitle,
  children,
  actions,
  loading = false,
  className = "",
  height = "h-80",
}) {
  if (loading) {
    return <ChartSkeleton className={className} height={height} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white dark:bg-slate-800 rounded-2xl p-6 
        shadow-sm border border-gray-100 dark:border-slate-700
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Chart Container */}
      <div className={height}>{children}</div>
    </motion.div>
  );
}

// Compact chart card variant
export function ChartCardCompact({
  title,
  value,
  trend,
  children,
  className = "",
}) {
  return (
    <div
      className={`
        bg-white dark:bg-slate-800 rounded-xl p-4 
        shadow-sm border border-gray-100 dark:border-slate-700
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend > 0
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      {value && (
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {value}
        </p>
      )}
      <div className="h-20">{children}</div>
    </div>
  );
}
