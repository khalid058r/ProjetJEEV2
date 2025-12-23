export default function BestSellerCard({ title, data }) {
  if (!data) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border">
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow border flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-lg mb-3">{title}</h3>

        <p className="text-2xl font-bold text-blue-600">
          {data.name}
        </p>

        <p className="text-gray-500 mt-1">
          {data.value} sales
        </p>
      </div>
    </div>
  );
}
