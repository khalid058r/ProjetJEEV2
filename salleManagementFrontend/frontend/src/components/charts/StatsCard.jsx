export default function StatsCard({ title, value, danger }) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow border
      ${danger ? "border-red-300" : "border-gray-100"}`}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-3xl font-bold mt-2
        ${danger ? "text-red-600" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
