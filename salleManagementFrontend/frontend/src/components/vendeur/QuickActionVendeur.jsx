
export default function QuickActionVendeur({ onSale, onProducts, onVentes }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <button onClick={onSale} className="bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold rounded-xl shadow p-6">
        Nouvelle Vente
      </button>
      <button onClick={onVentes} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-xl shadow p-6">
        Mes Ventes
      </button>
      <button onClick={onProducts} className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold rounded-xl shadow p-6">
        Produits
      </button>
    </div>
  );
}