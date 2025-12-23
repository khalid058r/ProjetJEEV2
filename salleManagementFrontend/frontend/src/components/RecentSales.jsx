import { useNavigate } from "react-router-dom";

export default function RecentSales({ sales }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <h2 className="font-semibold mb-4">Recent Sales</h2>

      {sales.slice(0, 5).map(s => (
        <div
          key={s.id}
          onClick={() => navigate(`/sales/${s.id}`)}
          className="flex justify-between py-2 cursor-pointer hover:bg-gray-50"
        >
          <span>Sale #{s.id}</span>
          <span className="font-semibold">
            {s.totalAmount.toFixed(2)} MAD
          </span>
        </div>
      ))}
    </div>
  );
}
