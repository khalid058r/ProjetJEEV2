export default function LowStock({ products }) {
  const low = products.filter(p => p.stock <= 5);

  return (
    <div className="bg-white p-6 rounded-xl border shadow">
      <h2 className="font-semibold mb-4">Low Stock</h2>

      {low.length === 0 && (
        <p className="text-gray-500">All products OK ✅</p>
      )}

      {low.map(p => (
        <div key={p.id} className="flex justify-between text-red-600 mb-2">
          <span>{p.title}</span>
          <span>{p.stock}</span>
        </div>
      ))}
    </div>
  );
}
