import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./router/AppRouter";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";
import { Toaster } from 'react-hot-toast';

import { ToastProvider } from "./components/Toast"; 

ReactDOM.createRoot(document.getElementById("root")).render(
    <ToastProvider>   
        <ThemeProvider>
             <UserProvider>
                <AppRouter />
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#fff',
                      color: '#363636',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#34a853',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 4000,
                      iconTheme: {
                        primary: '#ea4335',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
            </UserProvider>
        </ThemeProvider>      
    </ToastProvider>
);
