import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./router/AppRouterNew";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";
import { DarkModeProvider } from "./context/DarkModeContext";
import { Toaster } from 'react-hot-toast';

import { ToastProvider } from "./components/Toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <DarkModeProvider>
    <ToastProvider>
      <ThemeProvider>
        <UserProvider>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-text)',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </UserProvider>
      </ThemeProvider>
    </ToastProvider>
  </DarkModeProvider>
);
