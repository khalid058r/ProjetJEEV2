import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function VendeurSalesChart({ data }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="font-bold mb-4">Daily Sales</h3>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line dataKey="total" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
