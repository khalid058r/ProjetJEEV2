import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Check, AlertCircle, Info, Loader2, ChevronDown,
    Eye, EyeOff, Search, Upload, Image as ImageIcon, Bell, CheckCheck, Trash2
} from 'lucide-react'
import { useState, forwardRef, useRef, useEffect } from 'react'

// ============ BUTTON ============
export const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    ...props
}, ref) => {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
        danger: 'btn-danger',
        success: 'px-4 py-2 bg-gradient-to-r from-success-500 to-success-600 text-white font-medium rounded-xl hover:from-success-600 hover:to-success-700 transition-all shadow-lg shadow-success-500/25',
        outline: 'px-4 py-2 border-2 border-primary-500 text-primary-600 dark:text-primary-400 font-medium rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all',
    }

    const sizes = {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-6 py-3',
        xl: 'text-lg px-8 py-4',
    }

    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={clsx(
                variants[variant],
                sizes[size],
                'inline-flex items-center justify-center gap-2',
                className
            )}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : Icon && iconPosition === 'left' ? (
                <Icon className="w-4 h-4" />
            ) : null}
            {children}
            {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </button>
    )
})

// ============ INPUT ============
export const Input = forwardRef(({
    label,
    error,
    icon: Icon,
    type = 'text',
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'

    return (
        <div className={clsx('space-y-1.5', containerClassName)}>
            {label && (
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                )}
                <input
                    ref={ref}
                    type={isPassword && showPassword ? 'text' : type}
                    className={clsx(
                        'input-field',
                        Icon && 'pl-10',
                        isPassword && 'pr-10',
                        error && 'border-danger-500 focus:ring-danger-500/50 focus:border-danger-500',
                        className
                    )}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                )}
            </div>
            {error && (
                <p className="text-sm text-danger-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </p>
            )}
        </div>
    )
})

// ============ SELECT ============
export const Select = forwardRef(({
    label,
    error,
    options = [],
    placeholder = 'Sélectionner...',
    className = '',
    ...props
}, ref) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    className={clsx(
                        'input-field appearance-none pr-10 cursor-pointer',
                        error && 'border-danger-500',
                        className
                    )}
                    {...props}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
            </div>
            {error && (
                <p className="text-sm text-danger-500">{error}</p>
            )}
        </div>
    )
})

// ============ TEXTAREA ============
export const Textarea = forwardRef(({
    label,
    error,
    className = '',
    rows = 4,
    ...props
}, ref) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                rows={rows}
                className={clsx(
                    'input-field resize-none',
                    error && 'border-danger-500',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="text-sm text-danger-500">{error}</p>
            )}
        </div>
    )
})

// ============ CARD ============
export function Card({
    children,
    className = '',
    hover = false,
    padding = true,
    ...props
}) {
    return (
        <div
            className={clsx(
                'card',
                hover && 'card-hover cursor-pointer',
                padding && 'p-6',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

// ============ MODAL ============
export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showClose = true,
}) {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-6xl',
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className={clsx(
                                'relative w-full bg-white dark:bg-dark-800 rounded-2xl shadow-xl',
                                sizes[size]
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {title && (
                                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
                                    <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                                        {title}
                                    </h3>
                                    {showClose && (
                                        <button
                                            onClick={onClose}
                                            className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5 text-dark-500" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="p-6">{children}</div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    )
}

// ============ BADGE ============
export function Badge({
    children,
    variant = 'primary',
    size = 'md',
    dot = false,
    className = '',
}) {
    const variants = {
        primary: 'badge-primary',
        success: 'badge-success',
        warning: 'badge-warning',
        danger: 'badge-danger',
        secondary: 'bg-dark-100 dark:bg-dark-700 text-dark-700 dark:text-dark-300',
    }

    const sizes = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1',
    }

    return (
        <span className={clsx('badge', variants[variant], sizes[size], className)}>
            {dot && (
                <span className={clsx(
                    'w-1.5 h-1.5 rounded-full mr-1.5',
                    variant === 'success' && 'bg-success-500',
                    variant === 'warning' && 'bg-warning-500',
                    variant === 'danger' && 'bg-danger-500',
                    variant === 'primary' && 'bg-primary-500',
                )} />
            )}
            {children}
        </span>
    )
}

// ============ AVATAR ============
export function Avatar({
    src,
    name,
    size = 'md',
    className = '',
}) {
    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
    }

    const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={clsx('rounded-full object-cover', sizes[size], className)}
            />
        )
    }

    return (
        <div className={clsx(
            'rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold',
            sizes[size],
            className
        )}>
            {initials || '?'}
        </div>
    )
}

// ============ SKELETON ============
export function Skeleton({
    className = '',
    variant = 'text',
    width,
    height,
}) {
    const variants = {
        text: 'h-4 rounded',
        title: 'h-6 rounded',
        avatar: 'rounded-full',
        card: 'h-32 rounded-xl',
        image: 'rounded-xl',
    }

    return (
        <div
            className={clsx(
                'animate-pulse bg-dark-200 dark:bg-dark-700',
                variants[variant],
                className
            )}
            style={{ width, height }}
        />
    )
}

// ============ EMPTY STATE ============
export function EmptyState({
    icon: Icon = Info,
    title = 'Aucune donnée',
    description,
    action,
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="p-4 bg-dark-100 dark:bg-dark-800 rounded-full mb-4">
                <Icon className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-lg font-medium text-dark-700 dark:text-dark-300 mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-dark-500 max-w-sm mb-4">{description}</p>
            )}
            {action}
        </div>
    )
}

// ============ LOADING ============
export function Loading({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    }

    return (
        <div className={clsx('flex items-center justify-center', className)}>
            <Loader2 className={clsx('animate-spin text-primary-500', sizes[size])} />
        </div>
    )
}

// ============ PAGE LOADING ============
export function PageLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950">
            <div className="text-center space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-900 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-dark-500 font-medium">Chargement...</p>
            </div>
        </div>
    )
}

// ============ SEARCH INPUT ============
export function SearchInput({
    value,
    onChange,
    placeholder = 'Rechercher...',
    className = '',
}) {
    return (
        <div className={clsx('relative', className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="input-field pl-10"
            />
        </div>
    )
}

// ============ IMAGE UPLOAD ============
export function ImageUpload({
    value,
    onChange,
    onUpload,
    label = 'Image',
    className = '',
}) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState(value || '')

    // Mettre à jour le preview quand value change
    useEffect(() => {
        if (value) {
            setPreview(value)
        }
    }, [value])

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Preview
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target.result)
        reader.readAsDataURL(file)

        // Si onUpload est fourni, uploader et passer l'URL
        if (onUpload) {
            setUploading(true)
            try {
                const url = await onUpload(file)
                onChange(url)
            } catch (error) {
                console.error('Upload failed:', error)
            } finally {
                setUploading(false)
            }
        } else {
            // Sinon, passer le fichier directement à onChange
            onChange(file)
        }
    }

    return (
        <div className={clsx('space-y-2', className)}>
            {label && (
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="image-upload"
                />
                <label
                    htmlFor="image-upload"
                    className={clsx(
                        'flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
                        'border-dark-300 dark:border-dark-600 hover:border-primary-500 dark:hover:border-primary-500',
                        'bg-dark-50 dark:bg-dark-800/50'
                    )}
                >
                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        <>
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-dark-400 mb-2" />
                                    <span className="text-sm text-dark-500">Cliquer pour uploader</span>
                                </>
                            )}
                        </>
                    )}
                </label>
            </div>
        </div>
    )
}

// ============ CONFIRM DIALOG ============
export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmer',
    message = 'Êtes-vous sûr?',
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    variant = 'danger',
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p className="text-dark-600 dark:text-dark-400 mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={onClose}>
                    {cancelText}
                </Button>
                <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>
                    {confirmText}
                </Button>
            </div>
        </Modal>
    )
}

// ============ STAT CARD ============
export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendLabel,
    color = 'primary',
    className = '',
}) {
    const colors = {
        primary: 'from-primary-500 to-primary-600',
        secondary: 'from-secondary-500 to-secondary-600',
        success: 'from-success-500 to-success-600',
        warning: 'from-warning-500 to-warning-600',
        danger: 'from-danger-500 to-danger-600',
    }

    const iconColors = {
        primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
        secondary: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
        success: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
        warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
        danger: 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
    }

    return (
        <Card className={clsx('stat-card', className)}>
            <div className="flex items-start justify-between mb-4">
                {Icon && (
                    <div className={clsx('p-3 rounded-xl', iconColors[color])}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
                {trend !== undefined && (
                    <Badge variant={
                        typeof trend === 'object'
                            ? (trend.positive ? 'success' : 'danger')
                            : (trend >= 0 ? 'success' : 'danger')
                    } dot>
                        {typeof trend === 'object'
                            ? `${trend.positive ? '+' : '-'}${trend.value}%`
                            : `${trend >= 0 ? '+' : ''}${trend}%`
                        }
                    </Badge>
                )}
            </div>
            <h3 className="text-2xl font-bold text-dark-900 dark:text-white mb-1">
                {value}
            </h3>
            <p className="text-dark-500 text-sm">{title}</p>
            {subtitle && (
                <p className="text-dark-400 text-xs mt-1">{subtitle}</p>
            )}
        </Card>
    )
}

// ============ PAGINATION ============
export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    totalItems,
    showItemsPerPage = true,
    className = ''
}) {
    const pages = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
    }

    if (totalPages <= 1) return null

    return (
        <div className={clsx('flex flex-col sm:flex-row items-center justify-between gap-4 mt-6', className)}>
            <div className="flex items-center gap-2 text-sm text-dark-500">
                <span>Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems}</span>
            </div>

            <div className="flex items-center gap-2">
                {showItemsPerPage && onItemsPerPageChange && (
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                        <option value={5}>5 / page</option>
                        <option value={10}>10 / page</option>
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                    </select>
                )}

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Première page"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Page précédente"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {startPage > 1 && (
                        <>
                            <button
                                onClick={() => onPageChange(1)}
                                className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                            >
                                1
                            </button>
                            {startPage > 2 && <span className="px-1 text-dark-400">...</span>}
                        </>
                    )}

                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={clsx(
                                'px-3 py-1.5 text-sm rounded-lg font-medium transition-all',
                                page === currentPage
                                    ? 'bg-primary-500 text-white'
                                    : 'hover:bg-gray-100 dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300'
                            )}
                        >
                            {page}
                        </button>
                    ))}

                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span className="px-1 text-dark-400">...</span>}
                            <button
                                onClick={() => onPageChange(totalPages)}
                                className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Page suivante"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Dernière page"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============ DATE RANGE PICKER ============
export function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    className = ''
}) {
    return (
        <div className={clsx('flex items-center gap-2', className)}>
            <div className="relative">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
            </div>
            <span className="text-dark-400">à</span>
            <div className="relative">
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    min={startDate}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
            </div>
        </div>
    )
}

// ============ FILTER DROPDOWN ============
export function FilterDropdown({
    label,
    value,
    onChange,
    options = [],
    icon: Icon,
    className = ''
}) {
    return (
        <div className={clsx('relative', className)}>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-dark-400" />}
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="appearance-none px-3 py-2 pr-8 text-sm border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                    <option value="">{label}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
            </div>
        </div>
    )
}

// ============ RANGE SLIDER ============
export function RangeSlider({
    label,
    min = 0,
    max = 100,
    value,
    onChange,
    step = 1,
    showValue = true,
    formatValue = (v) => v,
    className = ''
}) {
    return (
        <div className={clsx('space-y-2', className)}>
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-dark-700 dark:text-dark-300">{label}</label>
                    {showValue && (
                        <span className="text-sm text-primary-500 font-medium">{formatValue(value)}</span>
                    )}
                </div>
            )}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-dark-400">
                <span>{formatValue(min)}</span>
                <span>{formatValue(max)}</span>
            </div>
        </div>
    )
}

// ============ ALERT BOX ============
export function AlertBox({
    type = 'info',
    title,
    message,
    icon: CustomIcon,
    onClose,
    action,
    className = ''
}) {
    const configs = {
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            icon: Info,
            iconColor: 'text-blue-500'
        },
        success: {
            bg: 'bg-success-50 dark:bg-success-900/20',
            border: 'border-success-200 dark:border-success-800',
            icon: Check,
            iconColor: 'text-success-500'
        },
        warning: {
            bg: 'bg-warning-50 dark:bg-warning-900/20',
            border: 'border-warning-200 dark:border-warning-800',
            icon: AlertCircle,
            iconColor: 'text-warning-500'
        },
        danger: {
            bg: 'bg-danger-50 dark:bg-danger-900/20',
            border: 'border-danger-200 dark:border-danger-800',
            icon: AlertCircle,
            iconColor: 'text-danger-500'
        }
    }

    const config = configs[type]
    const IconComponent = CustomIcon || config.icon

    return (
        <div className={clsx(
            'p-4 rounded-xl border',
            config.bg,
            config.border,
            className
        )}>
            <div className="flex items-start gap-3">
                <IconComponent className={clsx('w-5 h-5 mt-0.5 flex-shrink-0', config.iconColor)} />
                <div className="flex-1">
                    {title && <h4 className="font-medium text-dark-900 dark:text-white mb-1">{title}</h4>}
                    <p className="text-sm text-dark-600 dark:text-dark-300">{message}</p>
                    {action && (
                        <button
                            onClick={action.onClick}
                            className="mt-2 text-sm font-medium text-primary-500 hover:text-primary-600"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                    >
                        <X className="w-4 h-4 text-dark-400" />
                    </button>
                )}
            </div>
        </div>
    )
}

// ============ NOTIFICATION CENTER ============
export function NotificationCenter({
    notifications = [],
    unreadCount = 0,
    onMarkAsRead,
    onMarkAllAsRead,
    onRemove,
    onClear,
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <Check className="w-4 h-4 text-success-500" />
            case 'error': return <AlertCircle className="w-4 h-4 text-danger-500" />
            case 'warning': return <AlertCircle className="w-4 h-4 text-warning-500" />
            default: return <Info className="w-4 h-4 text-primary-500" />
        }
    }

    const getTimeAgo = (timestamp) => {
        const now = new Date()
        const date = new Date(timestamp)
        const diff = Math.floor((now - date) / 1000)

        if (diff < 60) return "À l'instant"
        if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
        if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
        return `Il y a ${Math.floor(diff / 86400)}j`
    }

    return (
        <div className={clsx('relative', className)} ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl transition-colors"
            >
                <Bell className="w-5 h-5 text-dark-500" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-200 dark:border-dark-700 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
                            <h3 className="font-semibold text-dark-900 dark:text-white">
                                Notifications
                            </h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={onMarkAllAsRead}
                                        className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3 h-3" />
                                        Tout lire
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={onClear}
                                        className="text-xs text-dark-400 hover:text-danger-500 font-medium flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Vider
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.slice(0, 10).map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => onMarkAsRead?.(notif.id)}
                                        className={clsx(
                                            'p-4 border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50 cursor-pointer transition-colors',
                                            !notif.read && 'bg-primary-50/50 dark:bg-primary-900/10'
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-dark-900 dark:text-white">
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-dark-500 truncate">
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-dark-400 mt-1">
                                                    {getTimeAgo(notif.timestamp)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRemove?.(notif.id) }}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-3 h-3 text-dark-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <Bell className="w-10 h-10 text-dark-300 mx-auto mb-2" />
                                    <p className="text-sm text-dark-500">Aucune notification</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 10 && (
                            <div className="p-3 border-t border-gray-200 dark:border-dark-700 text-center">
                                <button className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                                    Voir toutes les notifications
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// Export all
export default {
    Button,
    Input,
    Select,
    Textarea,
    Card,
    Modal,
    Badge,
    Avatar,
    Skeleton,
    EmptyState,
    Loading,
    PageLoading,
    SearchInput,
    ImageUpload,
    ConfirmDialog,
    StatCard,
    Pagination,
    DateRangePicker,
    FilterDropdown,
    RangeSlider,
    AlertBox,
    NotificationCenter,
}

// Export NotificationBell component
export { default as NotificationBell } from './NotificationBell'
