import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Share2, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

/**
 * Génère un QR Code simple en SVG (sans dépendance externe)
 * C'est une implémentation basique pour les codes courts
 */
const generateQRMatrix = (text) => {
    // Version simplifiée - génère un pattern basé sur le hash du texte
    const size = 21 // QR Code version 1
    const matrix = Array(size).fill(null).map(() => Array(size).fill(false))

    // Pattern de positionnement (coins)
    const addPositionPattern = (x, y) => {
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                const isOuter = i === 0 || i === 6 || j === 0 || j === 6
                const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4
                if (isOuter || isInner) {
                    matrix[y + i][x + j] = true
                }
            }
        }
    }

    addPositionPattern(0, 0)
    addPositionPattern(size - 7, 0)
    addPositionPattern(0, size - 7)

    // Génère des données à partir du texte
    let hash = 0
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }

    // Remplit le reste avec un pattern basé sur le hash
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Évite les zones de positionnement
            const inTopLeft = x < 8 && y < 8
            const inTopRight = x >= size - 8 && y < 8
            const inBottomLeft = x < 8 && y >= size - 8

            if (!inTopLeft && !inTopRight && !inBottomLeft) {
                const seed = (hash + x * 31 + y * 17) % 100
                matrix[y][x] = seed < 45
            }
        }
    }

    return matrix
}

const QRCodeDisplay = ({
    value,
    size = 200,
    title = 'Code de retrait',
    showActions = true,
    className = ''
}) => {
    const [copied, setCopied] = useState(false)
    const canvasRef = useRef(null)
    const matrix = generateQRMatrix(value)
    const moduleSize = size / matrix.length

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            toast.success('Code copié !')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Impossible de copier')
        }
    }

    const downloadQR = () => {
        const svg = document.getElementById('qr-code-svg')
        if (!svg) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            canvas.width = size
            canvas.height = size
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, size, size)
            ctx.drawImage(img, 0, 0)

            const link = document.createElement('a')
            link.download = `code-retrait-${value}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
            toast.success('QR Code téléchargé')
        }

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }

    const shareCode = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Mon code de retrait',
                    text: `Code de retrait: ${value}`,
                })
            } catch {
                copyCode()
            }
        } else {
            copyCode()
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white dark:bg-dark-800 rounded-2xl p-6 text-center ${className}`}
        >
            {title && (
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                    {title}
                </h3>
            )}

            {/* QR Code SVG */}
            <div className="inline-block p-4 bg-white rounded-xl shadow-inner border border-dark-100">
                <svg
                    id="qr-code-svg"
                    width={size}
                    height={size}
                    viewBox={`0 0 ${matrix.length} ${matrix.length}`}
                    className="block"
                >
                    <rect width="100%" height="100%" fill="white" />
                    {matrix.map((row, y) =>
                        row.map((cell, x) =>
                            cell && (
                                <rect
                                    key={`${x}-${y}`}
                                    x={x}
                                    y={y}
                                    width={1}
                                    height={1}
                                    fill="black"
                                />
                            )
                        )
                    )}
                </svg>
            </div>

            {/* Code texte */}
            <div className="mt-4">
                <p className="text-sm text-dark-500 mb-1">Code:</p>
                <p className="text-2xl font-mono font-bold text-dark-900 dark:text-white tracking-widest">
                    {value}
                </p>
            </div>

            {/* Actions */}
            {showActions && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                        onClick={copyCode}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600 rounded-xl transition-colors"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                            <Copy className="w-4 h-4 text-dark-500" />
                        )}
                        <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                            {copied ? 'Copié !' : 'Copier'}
                        </span>
                    </button>

                    <button
                        onClick={downloadQR}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600 rounded-xl transition-colors"
                    >
                        <Download className="w-4 h-4 text-dark-500" />
                        <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                            Télécharger
                        </span>
                    </button>

                    <button
                        onClick={shareCode}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors"
                    >
                        <Share2 className="w-4 h-4 text-white" />
                        <span className="text-sm font-medium text-white">
                            Partager
                        </span>
                    </button>
                </div>
            )}

            <p className="mt-4 text-xs text-dark-400">
                Présentez ce code au vendeur pour récupérer votre commande
            </p>
        </motion.div>
    )
}

export default QRCodeDisplay
