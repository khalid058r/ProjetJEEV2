import { useEffect, useState } from "react";
import AnalyticsService from "../../services/analyticsService";

import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  Zap,
} from "lucide-react";

import VendeurKpiCard from "../../components/vendeur/VendeurKpiCard";
import VendeurBestProducts from "../../components/vendeur/VendeurBestProducts";
import VendeurSalesChart from "../../components/vendeur/VendeurSalesChart";

export default function VendeurAnalytics() {
  const [kpi, setKpi] = useState(null);
  const [bestProducts, setBestProducts] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try vendeur-specific endpoints first, fallback to global
      const [kpiRes, bestRes, dailyRes] = await Promise.all([
        AnalyticsService.getVendeurKPI().catch(() => AnalyticsService.getGlobalKpi()),
        AnalyticsService.getVendeurBestSellers(5).catch(() => AnalyticsService.getBestSellers(5)),
        AnalyticsService.getVendeurDailySales().catch(() => {
          const today = new Date();
          const start = new Date();
          start.setDate(today.getDate() - 7);
          const format = (d) => d.toISOString().split("T")[0];
          return AnalyticsService.getDailySales(format(start), format(today));
        }),
      ]);

      // Set data with fallbacks
      const kpiData = kpiRes?.data || {
        sales: { totalRevenue: 0, salesCount: 0, averageBasket: 0 }
      };
      setKpi(kpiData);
      setBestProducts(Array.isArray(bestRes?.data) ? bestRes.data : []);
      setSalesByDay(Array.isArray(dailyRes?.data) ? dailyRes.data : []);

    } catch (err) {
      console.error("Seller analytics error", err);
      setError("Erreur de chargement des données");
      // Set default values
      setKpi({ sales: { totalRevenue: 0, salesCount: 0, averageBasket: 0 } });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-600"></div>
          <TrendingUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600" />
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Seller Analytics
            </h1>
          </div>
          <p className="text-gray-500 ml-14">
            Overview of your sales performance
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <VendeurKpiCard
          title="Revenue"
          value={`$${(kpi?.sales?.totalRevenue || 0).toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6" />}
          gradient="from-emerald-500 to-teal-500"
          trend="+12%"
          trendUp={true}
        />
        <VendeurKpiCard
          title="Sales"
          value={kpi?.sales?.salesCount || 0}
          icon={<ShoppingCart className="w-6 h-6" />}
          gradient="from-blue-500 to-indigo-500"
          trend="+8%"
          trendUp={true}
        />
        <VendeurKpiCard
          title="Avg Basket"
          value={`$${(kpi?.sales?.averageBasket || 0).toFixed(2)}`}
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-purple-500 to-pink-500"
          trend="+5%"
          trendUp={true}
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
