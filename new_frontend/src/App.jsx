import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import { CartProvider } from './context/CartContext'
import AppRouter from './router/AppRouter'
import { ChatBot } from './components/chatbot'

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <CartProvider>
                        <NotificationProvider>
                            <AppRouter />
                            <ChatBot />
                            <Toaster
                                position="top-right"
                                toastOptions={{
                                    duration: 4000,
                                    style: {
                                        background: 'var(--toast-bg)',
                                        color: 'var(--toast-color)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                    },
                                    success: {
                                        iconTheme: { primary: '#10B981', secondary: '#fff' },
                                    },
                                    error: {
                                        iconTheme: { primary: '#EF4444', secondary: '#fff' },
                                    },
                                }}
                            />
                        </NotificationProvider>
                    </CartProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    )
}
