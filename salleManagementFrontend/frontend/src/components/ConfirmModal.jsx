export default function ConfirmModal({
  title = "Confirm action",
  message = "Are you sure?",
  confirmLabel = "Delete",
  onConfirm,
  onCancel
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-fadeIn">

        <h2 className="text-xl font-semibold mb-3">{title}</h2>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
