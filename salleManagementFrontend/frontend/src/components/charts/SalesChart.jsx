import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

export default function SalesChart({ sales }) {
  const data = sales.map(s => ({
    date: s.saleDate,
    total: s.totalAmount,
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <h3 className="font-semibold mb-4">Sales Over Time</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="total"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
