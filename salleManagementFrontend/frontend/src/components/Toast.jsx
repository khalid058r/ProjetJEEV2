import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

const toastConfig = {
  success: {
    icon: CheckCircle,
    bg: "bg-gradient-to-r from-emerald-500 to-green-500",
    iconColor: "text-white",
    progressColor: "bg-white/30",
  },
  error: {
    icon: XCircle,
    bg: "bg-gradient-to-r from-red-500 to-rose-500",
    iconColor: "text-white",
    progressColor: "bg-white/30",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-gradient-to-r from-amber-500 to-orange-500",
    iconColor: "text-white",
    progressColor: "bg-white/30",
  },
  info: {
    icon: Info,
    bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
    iconColor: "text-white",
    progressColor: "bg-white/30",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-5 right-5 space-y-3 z-50 max-w-sm">
        {toasts.map((toast) => {
          const config = toastConfig[toast.type] || toastConfig.info;
          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              className={`
                ${config.bg}
                px-4 py-3 rounded-xl shadow-2xl text-white
                flex items-start gap-3
                animate-slide-in
                backdrop-blur-sm
                border border-white/20
                transform transition-all duration-300
                hover:scale-[1.02]
              `}
              style={{
                animation: "slideIn 0.3s ease-out, fadeOut 0.3s ease-in forwards",
                animationDelay: `0s, ${toast.duration - 300}ms`,
              }}
            >
              <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-5">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden">
                <div
                  className={`h-full ${config.progressColor}`}
                  style={{
                    animation: `shrink ${toast.duration}ms linear forwards`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Global styles for animations */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
