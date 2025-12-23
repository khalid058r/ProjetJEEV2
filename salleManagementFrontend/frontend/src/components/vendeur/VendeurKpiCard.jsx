export default function VendeurKpiCard({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-blue-600">{icon}</div>
      </div>
    </div>
  );
}
