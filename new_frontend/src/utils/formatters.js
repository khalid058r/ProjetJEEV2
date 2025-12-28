import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

// Currency formatter
export function formatCurrency(amount, currency = 'MAD') {
    if (amount === null || amount === undefined) return '-'

    return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

// Number formatter
export function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) return '-'

    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num)
}

// Compact number formatter (1K, 1M, etc.)
export function formatCompactNumber(num) {
    if (num === null || num === undefined) return '-'

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
}

// Percentage formatter
export function formatPercent(value, decimals = 1) {
    if (value === null || value === undefined) return '-'
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

// Date formatters
export function formatDate(date, formatStr = 'dd/MM/yyyy') {
    if (!date) return '-'

    try {
        const d = typeof date === 'string' ? parseISO(date) : date
        return format(d, formatStr, { locale: fr })
    } catch {
        return '-'
    }
}

export function formatDateTime(date) {
    return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export function formatDateLong(date) {
    return formatDate(date, 'dd MMMM yyyy')
}

export function formatRelativeTime(date) {
    if (!date) return '-'

    try {
        const d = typeof date === 'string' ? parseISO(date) : date
        return formatDistanceToNow(d, { addSuffix: true, locale: fr })
    } catch {
        return '-'
    }
}

// Truncate text
export function truncate(str, length = 50) {
    if (!str) return ''
    return str.length > length ? str.substring(0, length) + '...' : str
}

// Capitalize first letter
export function capitalize(str) {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Generate initials from name
export function getInitials(name) {
    if (!name) return '?'
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

// Phone number formatter
export function formatPhone(phone) {
    if (!phone) return '-'
    // Format: +212 6XX-XXX-XXX
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
        return `+212 ${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return phone
}

// Status badge color
export function getStatusColor(status) {
    const colors = {
        active: 'success',
        inactive: 'secondary',
        pending: 'warning',
        completed: 'success',
        cancelled: 'danger',
        paid: 'success',
        unpaid: 'danger',
        low: 'warning',
        critical: 'danger',
        normal: 'success',
    }
    return colors[status?.toLowerCase()] || 'secondary'
}

// Stock status
export function getStockStatus(quantity, threshold = 10) {
    if (quantity <= 0) return { status: 'critical', label: 'Rupture', color: 'danger' }
    if (quantity <= threshold) return { status: 'low', label: 'Faible', color: 'warning' }
    return { status: 'normal', label: 'Normal', color: 'success' }
}

export default {
    formatCurrency,
    formatNumber,
    formatCompactNumber,
    formatPercent,
    formatDate,
    formatDateTime,
    formatDateLong,
    formatRelativeTime,
    truncate,
    capitalize,
    getInitials,
    formatPhone,
    getStatusColor,
    getStockStatus,
}
