export default function TopProducts({ map }) {
  const top = Object.entries(map).slice(0,5);

  return (
    <div className="bg-white p-6 rounded-xl border shadow">
      <h2 className="font-semibold mb-4">Top Products</h2>
      {top.map(([name, qty]) => (
        <div key={name} className="flex justify-between mb-2">
          <span>{name}</span>
          <span className="font-semibold">{qty}</span>
        </div>
      ))}
    </div>
  );
}
