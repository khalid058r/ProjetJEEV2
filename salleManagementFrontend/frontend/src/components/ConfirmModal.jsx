import { AlertTriangle, X, Trash2, CheckCircle } from "lucide-react";

export default function ConfirmModal({
  title = "Confirm action",
  message = "Are you sure?",
  confirmLabel = "Delete",
  type = "danger", // 'danger', 'warning', 'success'
  onConfirm,
  onCancel
}) {
  const typeStyles = {
    danger: {
      icon: Trash2,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      confirmBtn: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      confirmBtn: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
    },
    success: {
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      confirmBtn: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
    }
  };

  const style = typeStyles[type] || typeStyles.danger;
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "modalSlideIn 0.2s ease-out" }}
      >
        {/* Header */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`w-16 h-16 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-8 h-8 ${style.iconColor}`} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all duration-200"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              className={`flex-1 px-5 py-3 rounded-xl text-white font-semibold ${style.confirmBtn} shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02]`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
