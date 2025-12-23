import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Calendar,
  DollarSign,
} from "lucide-react";

export default function VenteCard({ sale }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/vendeur/sales/${sale.id}`)}
      className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition"
    >
      
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
        </div>

        <div>
          <p className="font-semibold text-gray-900">
            Sale #{sale.id}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            {sale.saleDate}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1 font-bold text-gray-900">
          <DollarSign className="h-4 w-4" />
          {sale.totalAmount.toFixed(2)}
        </div>

        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            sale.status === "CONFIRMED"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {sale.status}
        </span>
      </div>
    </div>
  );
}
