import { createContext, useContext, useEffect, useState } from "react";

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem("darkMode");
        if (saved !== null) return JSON.parse(saved);
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    const [accentColor, setAccentColor] = useState(() => {
        return localStorage.getItem("accentColor") || "cyber";
    });

    useEffect(() => {
        const root = document.documentElement;

        if (isDark) {
            root.classList.add("dark");
            root.style.colorScheme = "dark";
        } else {
            root.classList.remove("dark");
            root.style.colorScheme = "light";
        }

        localStorage.setItem("darkMode", JSON.stringify(isDark));
    }, [isDark]);

    useEffect(() => {
        localStorage.setItem("accentColor", accentColor);
        document.documentElement.setAttribute("data-accent", accentColor);
    }, [accentColor]);

    const toggleDarkMode = () => setIsDark(!isDark);

    const colors = {
        cyber: {
            primary: "from-cyan-500 to-blue-600",
            secondary: "from-purple-500 to-pink-500",
            accent: "#06b6d4",
        },
        neon: {
            primary: "from-green-400 to-cyan-500",
            secondary: "from-yellow-400 to-orange-500",
            accent: "#22c55e",
        },
        sunset: {
            primary: "from-orange-500 to-red-600",
            secondary: "from-pink-500 to-purple-600",
            accent: "#f97316",
        },
        aurora: {
            primary: "from-violet-500 to-purple-600",
            secondary: "from-blue-500 to-cyan-500",
            accent: "#8b5cf6",
        },
    };

    return (
        <DarkModeContext.Provider value={{
            isDark,
            toggleDarkMode,
            accentColor,
            setAccentColor,
            colors: colors[accentColor] || colors.cyber
        }}>
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
