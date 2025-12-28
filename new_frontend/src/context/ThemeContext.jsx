import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode')
        return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode))

        if (darkMode) {
            document.documentElement.classList.add('dark')
            document.documentElement.style.setProperty('--toast-bg', '#1E293B')
            document.documentElement.style.setProperty('--toast-color', '#F1F5F9')
        } else {
            document.documentElement.classList.remove('dark')
            document.documentElement.style.setProperty('--toast-bg', '#FFFFFF')
            document.documentElement.style.setProperty('--toast-color', '#1E293B')
        }
    }, [darkMode])

    const toggleDarkMode = () => setDarkMode(prev => !prev)

    const value = {
        darkMode,
        setDarkMode,
        toggleDarkMode,
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

export default ThemeContext
