export default function RecentSalesTable({ sales }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <h3 className="font-semibold mb-4">Recent Sales</h3>

      <table className="w-full">
        <tbody>
          {sales.map(s => (
            <tr key={s.id} className="border-t">
              <td className="p-2">INV-{s.id}</td>
              <td className="p-2">{s.username}</td>
              <td className="p-2">{s.totalAmount} MAD</td>
              <td className="p-2">
                <span className="px-2 py-1 bg-green-100 rounded text-sm">
                  {s.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
