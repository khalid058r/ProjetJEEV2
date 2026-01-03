// Chatbot API - Service Ollama
const CHATBOT_URL = 'http://localhost:5001/api'

export const chatbotApi = {
    // Chat principal
    sendMessage: (message, userId, userRole) =>
        fetch(`${CHATBOT_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, userId, userRole })
        }).then(res => res.json()),

    // Effacer l'historique
    clearHistory: (userId) =>
        fetch(`${CHATBOT_URL}/chat/clear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        }).then(res => res.json()),

    // Recherche rapide
    quickSearch: (query, limit = 5) =>
        fetch(`${CHATBOT_URL}/quick/search?q=${encodeURIComponent(query)}&limit=${limit}`)
            .then(res => res.json()),

    // Suggestions
    getSuggestions: (role) =>
        fetch(`${CHATBOT_URL}/suggestions?role=${role}`, { signal: AbortSignal.timeout(3000) })
            .then(res => res.json())
            .catch(() => ({ success: false, suggestions: [] })),

    // Analyse AI
    analyze: (prompt, contextType = 'general') =>
        fetch(`${CHATBOT_URL}/ai/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, contextType })
        }).then(res => res.json()),

    // Health check
    healthCheck: () =>
        fetch(`${CHATBOT_URL}/health`, { signal: AbortSignal.timeout(3000) })
            .then(res => res.json())
            .catch(() => ({ status: 'unavailable' })),

    // Alertes
    getAlerts: (limit = 10) =>
        fetch(`${CHATBOT_URL}/alerts?limit=${limit}`).then(res => res.json()),

    // Analytics overview
    getAnalyticsOverview: () =>
        fetch(`${CHATBOT_URL}/analytics/overview`).then(res => res.json()),
}

export default chatbotApi
