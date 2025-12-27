import { Award, TrendingUp } from "lucide-react";
import { useDarkMode } from "../../context/DarkModeContext";

export default function VendeurBestProducts({ products = [] }) {
  const { darkMode } = useDarkMode();

  return (
    <div className={`p-6 rounded-2xl shadow-lg border ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'
      }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-hof-400 to-hof-500 rounded-xl shadow-lg">
          <Award className="w-5 h-5 text-white" />
        </div>
        <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-warm-900'}`}>Best Selling Products</h3>
      </div>

      {products.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-8 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>
          <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No products data yet</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((p, idx) => (
            <li
              key={p.productId || p.id || idx}
              className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer group ${darkMode
                  ? 'bg-warm-800 hover:bg-warm-700'
                  : 'bg-gradient-to-r from-warm-50 to-white hover:from-coral-50 hover:to-coral-50/30'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-coral-100 text-coral-700' :
                    idx === 1 ? 'bg-teal-100 text-teal-700' :
                      idx === 2 ? 'bg-hof-100 text-hof-700' :
                        darkMode ? 'bg-warm-700 text-warm-300' : 'bg-warm-100 text-warm-600'
                  }`}>
                  {idx + 1}
                </div>
                <span className={`font-medium transition-colors ${darkMode
                    ? 'text-white group-hover:text-coral-400'
                    : 'text-warm-900 group-hover:text-coral-600'
                  }`}>
                  {p.title || p.productName || p.name}
                </span>
              </div>
              <span className="font-bold text-teal-500 bg-teal-50 px-3 py-1 rounded-lg">
                ${(p.revenue || 0).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
