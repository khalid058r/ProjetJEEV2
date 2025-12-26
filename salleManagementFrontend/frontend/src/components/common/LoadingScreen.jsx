import { motion } from "framer-motion";

export default function LoadingScreen({ message = "Chargement..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        </div>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
      </motion.div>
    </div>
  );
}

// Inline loading spinner
export function LoadingSpinner({ size = "md", className = "" }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <div className="absolute inset-0 border-blue-200 dark:border-blue-900 rounded-full"></div>
      <div className="absolute inset-0 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
    </div>
  );
}

// Loading skeleton for content placeholders
export function Skeleton({ className = "", variant = "text" }) {
  const variants = {
    text: "h-4 rounded",
    title: "h-8 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "h-32 rounded-xl",
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-slate-700 ${variants[variant]} ${className}`}
    />
  );
}

// Loading skeleton for cards
export function CardSkeleton({ className = "" }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-24" variant="text" />
        <Skeleton className="w-10 h-10" variant="circular" />
      </div>
      <Skeleton className="w-32 mb-2" variant="title" />
      <Skeleton className="w-20" variant="text" />
    </div>
  );
}

// Loading skeleton for tables
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-4" variant="text" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 border-b border-gray-100 dark:border-slate-700/50 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="flex-1 h-4" variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for charts
export function ChartSkeleton({ className = "", height = "h-64" }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm ${className}`}>
      <Skeleton className="w-32 mb-4" variant="title" />
      <div className={`${height} flex items-end justify-around gap-2`}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${30 + Math.random() * 60}%` }}
            variant="rectangular"
          />
        ))}
      </div>
    </div>
  );
}
