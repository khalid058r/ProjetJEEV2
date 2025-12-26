import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";

// New architecture
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthProvider } from "./auth/AuthProvider";
import AppRouter from "./router/AppRouterNew";

// Styles
import "./index.css";

// ===========================================
// Toast configuration with dark mode support
// ===========================================
const toastOptions = {
  duration: 3000,
  position: "top-right",
  style: {
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
  },
  success: {
    duration: 3000,
    iconTheme: {
      primary: "#10b981",
      secondary: "#fff",
    },
    style: {
      background: "var(--toast-bg, #fff)",
      color: "var(--toast-text, #1f2937)",
    },
  },
  error: {
    duration: 4000,
    iconTheme: {
      primary: "#ef4444",
      secondary: "#fff",
    },
    style: {
      background: "var(--toast-bg, #fff)",
      color: "var(--toast-text, #1f2937)",
    },
  },
  loading: {
    iconTheme: {
      primary: "#3b82f6",
      secondary: "#fff",
    },
  },
};

// ===========================================
// App Root with Providers
// ===========================================
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
        <Toaster toastOptions={toastOptions} />
      </AuthProvider>
    </ThemeProvider>
  );
}

// ===========================================
// Render
// ===========================================
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
