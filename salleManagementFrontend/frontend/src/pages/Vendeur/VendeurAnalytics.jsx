import { useEffect, useState } from "react";
import AnalyticsService from "../../services/analyticsService";

import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import VendeurKpiCard from "../../components/vendeur/VendeurKpiCard";
import VendeurBestProducts from "../../components/vendeur/VendeurBestProducts";
import VendeurSalesChart from "../../components/vendeur/VendeurSalesChart";

export default function VendeurAnalytics() {
  const [kpi, setKpi] = useState(null);
  const [bestProducts, setBestProducts] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [kpiRes, bestRes, dailyRes] = await Promise.all([
        AnalyticsService.getVendeurKPI(),
        AnalyticsService.getVendeurBestSellers(5),
        AnalyticsService.getVendeurDailySales(),
      ]);

      setKpi(kpiRes.data);
      setBestProducts(bestRes.data);
      setSalesByDay(dailyRes.data);
    } catch (err) {
      console.error("Seller analytics error", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !kpi) {
    return <p className="p-6">Loading seller analytics...</p>;
  }

  return (
    <div className="p-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Seller Dashboard
        </h1>
        <p className="text-gray-600">
          Overview of your sales performance
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <VendeurKpiCard
          title="Revenue"
          value={`$${kpi.sales.totalRevenue.toFixed(2)}`}
          icon={<DollarSign />}
        />
        <VendeurKpiCard
          title="Sales"
          value={kpi.sales.salesCount}
          icon={<ShoppingCart />}
        />
        <VendeurKpiCard
          title="Avg Basket"
          value={`$${kpi.sales.averageBasket.toFixed(2)}`}
          icon={<TrendingUp />}
        />
      </div>

      {/* CHART + BEST SELLERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VendeurSalesChart data={salesByDay} />
        <VendeurBestProducts products={bestProducts} />
      </div>
    </div>
  );
}
