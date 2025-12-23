import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

import AnalyticsService from "../../services/analyticsService";
import { getSales } from "../../services/salesService";


export default function VendeurDashboard() {
  const navigate = useNavigate();

  const [kpi, setKpi] = useState(null);
  const [bestProducts, setBestProducts] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - 7);

      const format = (d) => d.toISOString().split("T")[0];

      const [kpiRes, bestRes, dailyRes] = await Promise.all([
        AnalyticsService.getGlobalKpi(),
        AnalyticsService.getBestSellers(5),
        AnalyticsService.getDailySales(
          format(start),
          format(today)
        ),
      ]);

      setKpi(kpiRes.data);
      setBestProducts(bestRes.data);
      setSalesByDay(dailyRes.data);
    } catch (err) {
      console.error("Dashboard error", err);
    }

    setLoading(false);
  };


  if (loading || !kpi) {
    return <p className="p-8">Loading seller dashboard...</p>;
  }

  return (
    <div className="p-8 space-y-10 bg-gray-50 min-h-screen">

      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Seller Dashboard
        </h1>
        <p className="text-gray-600">
          Overview of your sales activity
        </p>
      </div>

      {/* ================= KPI ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-green-600" />
            <h3 className="font-semibold text-gray-700">Revenue</h3>
          </div>
          <p className="text-2xl font-bold">
            ${kpi.sales.totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="text-blue-600" />
            <h3 className="font-semibold text-gray-700">Sales</h3>
          </div>
          <p className="text-2xl font-bold">
            {kpi.sales.salesCount}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-purple-600" />
            <h3 className="font-semibold text-gray-700">Avg Basket</h3>
          </div>
          <p className="text-2xl font-bold">
            ${kpi.sales.averageBasket.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ================= CHART + BEST PRODUCTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SALES BY DAY */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="font-bold text-gray-800 mb-4">
            Sales by Day
          </h2>

          {salesByDay.length === 0 ? (
            <p className="text-gray-500">No data</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {salesByDay.map((d) => (
                <li
                  key={d.date}
                  className="flex justify-between border-b pb-1"
                >
                  <span>{d.date}</span>
                  <span className="font-semibold">
                    ${d.revenue.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* BEST PRODUCTS */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="font-bold text-gray-800 mb-4">
            Best Products
          </h2>

          {bestProducts.length === 0 ? (
            <p className="text-gray-500">No products</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {bestProducts.map((p) => (
                <li
                  key={p.productId}
                  className="flex justify-between border-b pb-1"
                >
                  <span>{p.productName}</span>
                  <span className="font-semibold">
                    ${p.revenue.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ================= RECENT SALES ================= */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-800">
            Recent Sales
          </h2>
          <button
            onClick={() => navigate("/vendeur/sales")}
            className="flex items-center gap-1 text-blue-600 text-sm hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {recentSales.length === 0 ? (
          <p className="text-gray-500">No sales yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th>ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((s) => (
                <tr
                  key={s.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/vendeur/sales/${s.id}`)}
                >
                  <td className="py-2">#{s.id}</td>
                  <td>{s.saleDate}</td>
                  <td className="font-semibold">${s.totalAmount}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        s.status === "CONFIRMED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
