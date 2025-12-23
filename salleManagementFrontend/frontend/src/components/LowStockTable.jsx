export default function LowStockTable({ products }) {
  const lowStock = products.filter(p => p.stock < 5);

  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <h3 className="font-semibold mb-4 text-red-600">
        Low Stock Alert
      </h3>

      {lowStock.length === 0 ? (
        <p className="text-gray-500">All stocks OK ✅</p>
      ) : (
        <table className="w-full">
          <tbody>
            {lowStock.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.title}</td>
                <td className="p-2 font-bold text-red-600">
                  {p.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
