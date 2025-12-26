import { Award, TrendingUp } from "lucide-react";

export default function VendeurBestProducts({ products = [] }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
          <Award className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg">Best Selling Products</h3>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No products data yet</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((p, idx) => (
            <li
              key={p.productId || p.id || idx}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-amber-50 hover:to-orange-50/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-50 text-blue-600'
                  }`}>
                  {idx + 1}
                </div>
                <span className="font-medium text-gray-900 group-hover:text-amber-700 transition-colors">
                  {p.title || p.productName || p.name}
                </span>
              </div>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                ${(p.revenue || 0).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
