import { Loader2 } from "lucide-react";

export default function LoadingSpinner({
    size = "md",
    message = "Loading...",
    fullScreen = false,
    variant = "default" // 'default', 'primary', 'gradient'
}) {
    const sizes = {
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-16 h-16",
        xl: "w-20 h-20"
    };

    const variants = {
        default: "text-gray-400",
        primary: "text-blue-600",
        gradient: "text-transparent"
    };

    const Spinner = () => (
        <div className="flex flex-col items-center justify-center gap-4">
            {variant === "gradient" ? (
                <div className="relative">
                    <div className={`${sizes[size]} rounded-full border-4 border-gray-200`}></div>
                    <div
                        className={`absolute top-0 left-0 ${sizes[size]} rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin`}
                        style={{
                            background: "linear-gradient(to right, transparent, transparent)",
                            borderImage: "linear-gradient(to right, #3B82F6, #8B5CF6) 1"
                        }}
                    ></div>
                </div>
            ) : (
                <Loader2 className={`${sizes[size]} ${variants[variant]} animate-spin`} />
            )}
            {message && (
                <p className="text-gray-500 font-medium text-sm animate-pulse">{message}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                <Spinner />
            </div>
        );
    }

    return <Spinner />;
}

// Skeleton loader for content placeholders
export function Skeleton({ className = "", variant = "default" }) {
    const baseClass = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]";

    const variants = {
        default: "rounded-lg",
        circle: "rounded-full",
        text: "rounded h-4",
        card: "rounded-2xl",
    };

    return (
        <div
            className={`${baseClass} ${variants[variant]} ${className}`}
            style={{ animation: "shimmer 1.5s infinite" }}
        />
    );
}

// Card skeleton for loading states
export function CardSkeleton({ count = 1 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <Skeleton variant="circle" className="w-12 h-12" />
                        <div className="flex-1 space-y-2">
                            <Skeleton variant="text" className="w-3/4" />
                            <Skeleton variant="text" className="w-1/2" />
                        </div>
                    </div>
                    <Skeleton variant="default" className="w-full h-32" />
                </div>
            ))}
        </>
    );
}

// Table skeleton for loading tables
export function TableSkeleton({ rows = 5, cols = 4 }) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex gap-4">
                    {Array.from({ length: cols }).map((_, i) => (
                        <Skeleton key={i} variant="text" className="flex-1" />
                    ))}
                </div>
            </div>
            <div className="divide-y divide-gray-50">
                {Array.from({ length: rows }).map((_, rowIdx) => (
                    <div key={rowIdx} className="p-4 flex gap-4">
                        {Array.from({ length: cols }).map((_, colIdx) => (
                            <Skeleton key={colIdx} variant="text" className="flex-1" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Stats skeleton for dashboard KPIs
export function StatsSkeleton({ count = 4 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton variant="circle" className="w-12 h-12" />
                        <Skeleton variant="text" className="w-16" />
                    </div>
                    <Skeleton variant="text" className="w-24 mb-2" />
                    <Skeleton variant="text" className="w-32 h-8" />
                </div>
            ))}
        </div>
    );
}
