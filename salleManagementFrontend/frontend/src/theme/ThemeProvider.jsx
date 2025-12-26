import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeContext = createContext(null);

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode colors
          primary: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
          secondary: { main: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed' },
          success: { main: '#10b981', light: '#34d399', dark: '#059669' },
          warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
          error: { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
          background: { default: '#f8fafc', paper: '#ffffff' },
          text: { primary: '#1e293b', secondary: '#64748b' },
          divider: '#e2e8f0',
        }
      : {
          // Dark mode colors
          primary: { main: '#60a5fa', light: '#93c5fd', dark: '#3b82f6' },
          secondary: { main: '#a78bfa', light: '#c4b5fd', dark: '#8b5cf6' },
          success: { main: '#34d399', light: '#6ee7b7', dark: '#10b981' },
          warning: { main: '#fbbf24', light: '#fcd34d', dark: '#f59e0b' },
          error: { main: '#f87171', light: '#fca5a5', dark: '#ef4444' },
          background: { default: '#0f172a', paper: '#1e293b' },
          text: { primary: '#f1f5f9', secondary: '#94a3b8' },
          divider: '#334155',
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === 'light' 
            ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
            : '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: mode === 'light' ? '#e2e8f0' : '#334155',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("theme-mode");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem("theme-primary") || "blue";
  });

  // Sync with system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      if (!localStorage.getItem("theme-mode")) {
        setMode(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply theme to HTML element for Tailwind
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    localStorage.setItem("theme-mode", mode);
    localStorage.setItem("theme-primary", primaryColor);
  }, [mode, primaryColor]);

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const muiTheme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const value = useMemo(() => ({
    mode,
    isDark: mode === "dark",
    isLight: mode === "light",
    toggleMode,
    setMode,
    primaryColor,
    setPrimaryColor,
  }), [mode, primaryColor]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
