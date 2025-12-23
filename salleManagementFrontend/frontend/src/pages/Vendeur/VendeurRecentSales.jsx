import VenteCard from "./VenteCard";
import { ArrowRight } from "lucide-react";

export default function VendeurRecentSales({ sales = [], onViewAll }) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Recent Sales
        </h2>

        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* LIST */}
      {sales.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No sales yet
        </p>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <VenteCard key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </div>
  );
}
