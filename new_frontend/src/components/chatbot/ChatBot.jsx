import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Sparkles,
    RefreshCw,
    Minimize2,
    Maximize2,
    Search,
    TrendingUp,
    Package,
    AlertTriangle,
    ChevronDown
} from 'lucide-react'
import { chatbotApi } from '../../api/chatbot'
import { useAuth } from '../../context/AuthContext'
import ChatMessage from './ChatMessage'
import QuickActions from './QuickActions'

const ChatBot = () => {
    const { user, isAuthenticated } = useAuth()

    // Ne pas afficher le chatbot pour les clients (ACHETEUR) ou si non connecté
    const isBackOfficeUser = isAuthenticated && user?.role &&
        ['ADMIN', 'VENDEUR', 'ANALYSTE', 'INVESTISSEUR'].includes(user.role.toUpperCase())

    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [suggestions, setSuggestions] = useState([])
    const [isConnected, setIsConnected] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Check connection and load suggestions on mount (only for back-office users)
    useEffect(() => {
        if (isBackOfficeUser) {
            checkConnection()
            loadSuggestions()
        }
    }, [user?.role, isBackOfficeUser])

    // Add welcome message when chat opens
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage = getWelcomeMessage()
            setMessages([{
                id: Date.now(),
                type: 'bot',
                content: welcomeMessage,
                timestamp: new Date()
            }])
        }
    }, [isOpen])

    const checkConnection = async () => {
        try {
            const result = await chatbotApi.healthCheck()
            setIsConnected(result.status === 'healthy')
        } catch (error) {
            setIsConnected(false)
        }
    }

    const loadSuggestions = async () => {
        try {
            const result = await chatbotApi.getSuggestions(user?.role || 'VENDEUR')
            if (result.success) {
                setSuggestions(result.suggestions)
            }
        } catch (error) {
            console.error('Failed to load suggestions:', error)
        }
    }

    const getWelcomeMessage = () => {
        const role = user?.role?.toUpperCase() || 'VENDEUR'
        const messages = {
            ADMIN: `Bonjour ${user?.username || 'Admin'} ! Je suis votre assistant intelligent. Je peux vous aider a monitorer le systeme, analyser les ventes, gerer les produits et bien plus encore. Que puis-je faire pour vous ?`,
            VENDEUR: `Bonjour ${user?.username || ''} ! Je suis la pour vous aider a trouver des produits, suivre vos ventes et repondre a vos questions. Comment puis-je vous aider ?`,
            ANALYSTE: `Bonjour ${user?.username || ''} ! Je suis pret a vous assister dans vos analyses de donnees, predictions et rapports. Quelle analyse souhaitez-vous effectuer ?`,
            INVESTISSEUR: `Bonjour ${user?.username || ''} ! Je peux vous presenter les performances financieres et les metriques cles de l'entreprise. Que souhaitez-vous consulter ?`
        }
        return messages[role] || messages.VENDEUR
    }

    const handleSendMessage = async (messageText = inputValue) => {
        if (!messageText.trim() || isLoading) return

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: messageText.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue('')
        setIsLoading(true)

        try {
            const result = await chatbotApi.sendMessage(
                messageText.trim(),
                user?.id?.toString() || 'anonymous',
                user?.role || 'VENDEUR'
            )

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: result.message || 'Desole, je n\'ai pas pu traiter votre demande.',
                timestamp: new Date(),
                data: result.data,
                intent: result.intent
            }

            setMessages(prev => [...prev, botMessage])
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: 'Desole, une erreur s\'est produite. Verifiez que le service chatbot est en cours d\'execution.',
                timestamp: new Date(),
                isError: true
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleSuggestionClick = (suggestion) => {
        handleSendMessage(suggestion)
    }

    const handleClearHistory = async () => {
        try {
            await chatbotApi.clearHistory(user?.id?.toString() || 'anonymous')
            setMessages([{
                id: Date.now(),
                type: 'bot',
                content: 'Historique efface. Comment puis-je vous aider ?',
                timestamp: new Date()
            }])
        } catch (error) {
            console.error('Failed to clear history:', error)
        }
    }

    const toggleChat = () => {
        setIsOpen(!isOpen)
        if (!isOpen) {
            setUnreadCount(0)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized)
    }

    // Ne pas afficher le chatbot pour les non back-office users
    if (!isBackOfficeUser) {
        return null
    }

    return (
        <>
            {/* Chat Button */}
            <motion.button
                onClick={toggleChat}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 ${isOpen
                        ? 'bg-gray-600 dark:bg-gray-700'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                    }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="w-6 h-6 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            className="relative"
                        >
                            <Bot className="w-6 h-6 text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`fixed bottom-24 right-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
                            }`}
                        style={{ maxHeight: 'calc(100vh - 120px)' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Bot className="w-8 h-8 text-white" />
                                    <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-400' : 'bg-red-400'
                                        }`} />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Assistant IA</h3>
                                    <p className="text-indigo-100 text-xs">
                                        {isConnected ? 'En ligne' : 'Hors ligne'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleClearHistory}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Effacer l'historique"
                                >
                                    <RefreshCw className="w-4 h-4 text-white" />
                                </button>
                                <button
                                    onClick={toggleMinimize}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title={isMinimized ? 'Agrandir' : 'Reduire'}
                                >
                                    {isMinimized ? (
                                        <Maximize2 className="w-4 h-4 text-white" />
                                    ) : (
                                        <Minimize2 className="w-4 h-4 text-white" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages Container */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[420px] bg-gray-50 dark:bg-gray-900">
                                    {messages.map((message) => (
                                        <ChatMessage key={message.id} message={message} />
                                    ))}

                                    {isLoading && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                                                <Bot className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        En train de reflechir...
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Quick Actions */}
                                {messages.length <= 1 && suggestions.length > 0 && (
                                    <QuickActions
                                        suggestions={suggestions}
                                        onSuggestionClick={handleSuggestionClick}
                                    />
                                )}

                                {/* Input Area */}
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Posez votre question..."
                                                className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                disabled={isLoading || !isConnected}
                                            />
                                            <button
                                                onClick={() => handleSendMessage()}
                                                disabled={!inputValue.trim() || isLoading || !isConnected}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-purple-700 transition-all"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                                        Propulse par Ollama - LLM local
                                    </p>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default ChatBot
