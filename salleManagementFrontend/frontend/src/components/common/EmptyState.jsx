import {
    Inbox,
    Search,
    FileQuestion,
    AlertCircle,
    Plus,
    RefreshCw
} from "lucide-react";

const icons = {
    empty: Inbox,
    search: Search,
    error: AlertCircle,
    notFound: FileQuestion,
};

export default function EmptyState({
    icon = "empty",
    title = "No data found",
    description = "There's nothing here yet.",
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
    variant = "default" // 'default', 'compact', 'card'
}) {
    const Icon = icons[icon] || Inbox;

    const baseStyles = {
        default: "py-16",
        compact: "py-8",
        card: "py-12 bg-white rounded-2xl border border-gray-100 shadow-sm",
    };

    return (
        <div className={`flex flex-col items-center justify-center text-center px-4 ${baseStyles[variant]}`}>
            {/* Icon */}
            <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center">
                    <Icon className="w-10 h-10 text-gray-400" />
                </div>
                {/* Decorative dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-200 rounded-full opacity-60"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-200 rounded-full opacity-60"></div>
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-6">{description}</p>

            {/* Actions */}
            {(actionLabel || secondaryActionLabel) && (
                <div className="flex items-center gap-3">
                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02]"
                        >
                            <Plus className="w-4 h-4" />
                            {actionLabel}
                        </button>
                    )}
                    {secondaryActionLabel && onSecondaryAction && (
                        <button
                            onClick={onSecondaryAction}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {secondaryActionLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// Search empty state
export function SearchEmptyState({ query, onClear }) {
    return (
        <EmptyState
            icon="search"
            title="No results found"
            description={`We couldn't find anything matching "${query}". Try adjusting your search.`}
            actionLabel="Clear search"
            onAction={onClear}
        />
    );
}

// Error state
export function ErrorState({ error, onRetry }) {
    return (
        <EmptyState
            icon="error"
            title="Something went wrong"
            description={error || "An error occurred while loading the data. Please try again."}
            actionLabel="Try again"
            onAction={onRetry}
        />
    );
}

// Table empty state (more compact)
export function TableEmptyState({ entityName = "items", onCreate }) {
    return (
        <EmptyState
            variant="compact"
            icon="empty"
            title={`No ${entityName} yet`}
            description={`Create your first ${entityName.slice(0, -1)} to get started.`}
            actionLabel={`Add ${entityName.slice(0, -1)}`}
            onAction={onCreate}
        />
    );
}
