import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const defaultTheme = {
  mode: "light",           // 'light' | 'dark'
  primary: "blue",         // accent color
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("app-theme");
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  // Apply theme to HTML element
  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", theme.mode === "dark");

    root.style.setProperty("--primary", `var(--${theme.primary}-500)`);

    localStorage.setItem("app-theme", JSON.stringify(theme));
  }, [theme]);

  const toggleMode = () => {
    setTheme((t) => ({
      ...t,
      mode: t.mode === "light" ? "dark" : "light",
    }));
  };

  const setPrimary = (color) => {
    setTheme((t) => ({ ...t, primary: color }));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleMode, setPrimary }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
