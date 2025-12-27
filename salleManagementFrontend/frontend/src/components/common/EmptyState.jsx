import {
    Inbox,
    Search,
    FileQuestion,
    AlertCircle,
    Plus,
    RefreshCw
} from "lucide-react";
import { useDarkMode } from "../../context/DarkModeContext";

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
    const { darkMode } = useDarkMode();
    const Icon = icons[icon] || Inbox;

    const baseStyles = {
        default: "py-16",
        compact: "py-8",
        card: `py-12 rounded-2xl border shadow-sm ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`,
    };

    return (
        <div className={`flex flex-col items-center justify-center text-center px-4 ${baseStyles[variant]}`}>
            {/* Icon */}
            <div className="relative mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-warm-800 to-warm-900' : 'bg-gradient-to-br from-warm-100 to-warm-50'}`}>
                    <Icon className={`w-10 h-10 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`} />
                </div>
                {/* Decorative dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-coral-300 rounded-full opacity-60"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-teal-300 rounded-full opacity-60"></div>
            </div>

            {/* Content */}
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-warm-900'}`}>{title}</h3>
            <p className={`max-w-sm mb-6 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>{description}</p>

            {/* Actions */}
            {(actionLabel || secondaryActionLabel) && (
                <div className="flex items-center gap-3">
                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-coral-500 to-coral-600 text-white font-medium rounded-xl hover:from-coral-600 hover:to-coral-700 transition-all duration-200 shadow-lg shadow-coral-500/25 hover:shadow-xl hover:scale-[1.02]"
                        >
                            <Plus className="w-4 h-4" />
                            {actionLabel}
                        </button>
                    )}
                    {secondaryActionLabel && onSecondaryAction && (
                        <button
                            onClick={onSecondaryAction}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 font-medium rounded-xl transition-all duration-200 ${darkMode ? 'bg-warm-800 text-warm-300 hover:bg-warm-700' : 'bg-warm-100 text-warm-700 hover:bg-warm-200'}`}
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
