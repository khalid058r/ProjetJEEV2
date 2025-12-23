export default function VendeurBestProducts({ products }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="font-bold mb-4">Best Selling Products</h3>

      <ul className="space-y-3">
        {products.map((p) => (
          <li key={p.productId} className="flex justify-between">
            <span className="font-medium">{p.title}</span>
            <span className="text-blue-600 font-bold">
              ${p.revenue.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
