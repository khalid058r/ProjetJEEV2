import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

export default function CategoryPieChart({ sales, products, categories }) {

  if (!sales || !products || !categories) return null;

  // 🔹 Map productId → categoryId
  const productToCategory = {};
  products.forEach(p => {
    productToCategory[p.id] = p.categoryId;
  });

  // 🔹 Map categoryId → name
  const categoryNames = {};
  categories.forEach(c => {
    categoryNames[c.id] = c.name;
  });

  // 🔹 Aggregate revenue by category
  const revenueByCategory = {};

  sales.forEach(sale => {
    sale.lignes?.forEach(line => {
      const categoryId = productToCategory[line.productId];
      const categoryName = categoryNames[categoryId] || "Other";

      revenueByCategory[categoryName] =
        (revenueByCategory[categoryName] || 0) +
        line.quantity * line.unitPrice;
    });
  });

  const data = Object.entries(revenueByCategory).map(
    ([name, value]) => ({ name, value })
  );

  if (data.length === 0)
    return <p className="text-gray-400 text-center">No data</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          dataKey="value"
          paddingAngle={4}
        >
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}
