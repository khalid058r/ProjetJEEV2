import { createContext, useContext, useEffect, useState, useCallback } from "react";

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem("darkMode");
        if (saved !== null) {
            return JSON.parse(saved);
        }
        // Then check system preference
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        return false;
    });

    const [accentColor, setAccentColor] = useState(() => {
        return localStorage.getItem("accentColor") || "coral";
    });

    // Apply dark mode class to document
    useEffect(() => {
        const root = document.documentElement;
        
        if (isDark) {
            root.classList.add("dark");
            root.style.colorScheme = "dark";
            document.body.style.backgroundColor = '#0F0F0F';
            document.body.style.color = '#FFFFFF';
        } else {
            root.classList.remove("dark");
            root.style.colorScheme = "light";
            document.body.style.backgroundColor = '#F7F7F7';
            document.body.style.color = '#222222';
        }

        localStorage.setItem("darkMode", JSON.stringify(isDark));
    }, [isDark]);

    // Apply accent color
    useEffect(() => {
        localStorage.setItem("accentColor", accentColor);
        document.documentElement.setAttribute("data-accent", accentColor);
    }, [accentColor]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e) => {
            const saved = localStorage.getItem("darkMode");
            // Only auto-switch if user hasn't set a preference
            if (saved === null) {
                setIsDark(e.matches);
            }
        };
        
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const toggleDarkMode = useCallback(() => {
        setIsDark(prev => !prev);
    }, []);

    // Airbnb-inspired color palettes
    const colors = {
        coral: {
            primary: "from-coral-500 to-coral-600",
            secondary: "from-teal-500 to-teal-600",
            accent: "#FF5A5F",
            gradient: "linear-gradient(135deg, #FF5A5F 0%, #E04851 100%)",
        },
        teal: {
            primary: "from-teal-500 to-teal-600",
            secondary: "from-coral-500 to-coral-600",
            accent: "#00A699",
            gradient: "linear-gradient(135deg, #00A699 0%, #00D1C0 100%)",
        },
        sunset: {
            primary: "from-orange-500 to-red-500",
            secondary: "from-pink-500 to-purple-600",
            accent: "#FC642D",
            gradient: "linear-gradient(135deg, #FC642D 0%, #FF5A5F 100%)",
        },
        ocean: {
            primary: "from-blue-500 to-teal-500",
            secondary: "from-teal-500 to-cyan-500",
            accent: "#428BFF",
            gradient: "linear-gradient(135deg, #00A699 0%, #428BFF 100%)",
        },
    };

    const value = {
        isDark,
        setIsDark,
        toggleDarkMode,
        accentColor,
        setAccentColor,
        colors: colors[accentColor] || colors.coral,
        // Theme utilities
        theme: isDark ? 'dark' : 'light',
        bgClass: isDark ? 'bg-warm-950' : 'bg-warm-50',
        textClass: isDark ? 'text-white' : 'text-warm-900',
        borderClass: isDark ? 'border-warm-800' : 'border-warm-200',
        cardClass: isDark ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-200',
    };

    return (
        <DarkModeContext.Provider value={value}>
            {children}
        </DarkModeContext.Provider>
    );
}

export const useDarkMode = () => {
    const context = useContext(DarkModeContext);
    if (!context) {
        throw new Error("useDarkMode must be used within a DarkModeProvider");
    }
    return context;
};
