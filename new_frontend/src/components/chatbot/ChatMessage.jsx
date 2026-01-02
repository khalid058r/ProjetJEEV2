import { Bot, User, AlertCircle, Package, TrendingUp, Tag } from 'lucide-react'
import { motion } from 'framer-motion'

const ChatMessage = ({ message }) => {
    const isBot = message.type === 'bot'
    const isError = message.isError

    // Parse markdown-like formatting
    const formatContent = (content) => {
        if (!content) return ''

        // Ensure content is a string
        let textContent = content
        if (typeof content === 'object') {
            // If content is an object, try to extract message or convert to string
            textContent = content.message || content.text || content.response || JSON.stringify(content)
        }
        if (typeof textContent !== 'string') {
            textContent = String(textContent)
        }

        // Split by lines and process
        const lines = textContent.split('\n')

        return lines.map((line, index) => {
            // Headers (bold with **)
            if (line.startsWith('**') && line.endsWith('**')) {
                return (
                    <h4 key={index} className="font-bold text-gray-900 dark:text-white mt-2 mb-1">
                        {line.replace(/\*\*/g, '')}
                    </h4>
                )
            }

            // Bold text inline
            let formattedLine = line
            const boldRegex = /\*\*(.+?)\*\*/g
            const parts = []
            let lastIndex = 0
            let match

            while ((match = boldRegex.exec(line)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(line.substring(lastIndex, match.index))
                }
                parts.push(<strong key={`bold-${index}-${match.index}`}>{match[1]}</strong>)
                lastIndex = match.index + match[0].length
            }

            if (parts.length > 0) {
                if (lastIndex < line.length) {
                    parts.push(line.substring(lastIndex))
                }
                return <p key={index} className="text-gray-700 dark:text-gray-300">{parts}</p>
            }

            // List items
            if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                    <li key={index} className="text-gray-700 dark:text-gray-300 ml-4">
                        {line.substring(2)}
                    </li>
                )
            }

            // Emoji lines (stats)
            if (/^[^\w\s]/.test(line.trim()) && line.includes(':')) {
                return (
                    <p key={index} className="text-gray-700 dark:text-gray-300 py-0.5">
                        {line}
                    </p>
                )
            }

            // Empty lines
            if (line.trim() === '') {
                return <br key={index} />
            }

            // Regular text
            return (
                <p key={index} className="text-gray-700 dark:text-gray-300">
                    {line}
                </p>
            )
        })
    }

    // Render data cards if available
    const renderDataCards = () => {
        if (!message.data) return null

        const { products, sales_overview, inventory, categories, vendors } = message.data

        // Products list
        if (products && products.length > 0) {
            return (
                <div className="mt-3 space-y-2">
                    {products.slice(0, 3).map((product, idx) => (
                        <motion.div
                            key={product.id || idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {product.title?.substring(0, 30)}...
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{product.price?.toFixed(2)} MAD</span>
                                    {product.rating && <span>| {product.rating} etoiles</span>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )
        }

        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
        >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isBot
                    ? isError
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}>
                {isBot ? (
                    isError ? (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                        <Bot className="w-5 h-5 text-white" />
                    )
                ) : (
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[80%] ${isBot
                    ? 'bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl rounded-tr-none'
                } p-4 shadow-sm`}>
                <div className={`text-sm ${isBot ? '' : 'text-white'}`}>
                    {isBot ? formatContent(message.content) : (typeof message.content === 'string' ? message.content : String(message.content || ''))}
                </div>

                {/* Data Cards */}
                {isBot && renderDataCards()}

                {/* Intent Badge */}
                {isBot && message.intent && message.intent !== 'unknown' && message.intent !== 'general_question' && (
                    <div className="mt-2 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400 capitalize">
                            {message.intent.replace(/_/g, ' ')}
                        </span>
                    </div>
                )}

                {/* Timestamp */}
                <p className={`text-xs mt-2 ${isBot ? 'text-gray-400 dark:text-gray-500' : 'text-indigo-200'
                    }`}>
                    {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            </div>
        </motion.div>
    )
}

export default ChatMessage
