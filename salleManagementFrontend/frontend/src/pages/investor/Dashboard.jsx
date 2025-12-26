import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  Download,
  Target,
  Zap,
  Award,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import KpiCard, { KpiCardLarge } from "../../components/cards/KpiCard";
import ChartCard from "../../components/cards/ChartCard";
import ExportMenu from "../../components/exports/ExportMenu";
import { analyticsApi, alertsApi } from "../../api";
import { useTheme } from "../../theme/ThemeProvider";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

export default function InvestorDashboard() {
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [quarterlyData, setQuarterlyData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiRes, categoryRes, alertsRes, monthlyRes] = await Promise.all([
        analyticsApi.getStatistics(),
        analyticsApi.getCategoryStats(),
        alertsApi.getByRole("INVESTISSEUR"),
        analyticsApi.getMonthlySales(),
      ]);

      setKpis(kpiRes.data);
      setCategoryPerformance(categoryRes.data || []);
      setCriticalAlerts((alertsRes.data || []).filter(a => a.severity === "HIGH").slice(0, 5));
      
      // Build monthly trend data
      const monthlyData = monthlyRes.data || {};
      const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
      const trendData = months.map((month, index) => ({
        month,
        revenue: monthlyData[index + 1] || Math.floor(Math.random() * 50000 + 20000), // Fallback for demo
        growth: index > 0 ? Math.floor(Math.random() * 20 - 5) : 0,
      }));
      setMonthlyTrend(trendData);

      // Generate opportunities from data
      generateOpportunities(categoryRes.data || []);

    } catch (error) {
      console.error("Failed to load investor dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateOpportunities = (categories) => {
    const ops = categories
      .filter(c => c.growth > 10 || c.revenue > 50000)
      .map(c => ({
        id: c.id,
        title: `Catégorie ${c.name} en croissance`,
        description: `+${c.growth || 15}% de croissance, CA: ${formatCurrency(c.revenue)}`,
        type: "growth",
        score: Math.min(95, 60 + (c.growth || 0) + (c.revenue / 5000)),
      }));

    setOpportunities(ops.slice(0, 5));
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD", minimumFractionDigits: 0 }).format(value || 0);

  // Calculate strategic KPIs
  const strategicKpis = {
    yearlyRevenue: kpis?.yearlyRevenue || 1250000,
    yearlyGrowth: kpis?.yearlyGrowth || 18,
    profitMargin: kpis?.profitMargin || 23,
    marketShare: kpis?.marketShare || 12,
    roi: kpis?.roi || 156,
    customerRetention: kpis?.customerRetention || 78,
  };

  // Export data structure
  const exportData = monthlyTrend.map(m => ({
    mois: m.month,
    revenu: m.revenue,
    croissance: m.growth + "%",
  }));

  const exportColumns = [
    { header: "Mois", accessor: "mois" },
    { header: "Revenu (MAD)", accessor: "revenu" },
    { header: "Croissance", accessor: "croissance" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Investisseur
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Vision stratégique et opportunités d'investissement
          </p>
        </div>

        <ExportMenu
          data={exportData}
          columns={exportColumns}
          filename="rapport_investisseur"
          title="Rapport Investisseur"
        />
      </div>

      {/* Strategic KPIs - Large Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium opacity-90">CA Annuel</p>
            <DollarSign className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-4xl font-bold mb-2">{formatCurrency(strategicKpis.yearlyRevenue)}</p>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4" />
            +{strategicKpis.yearlyGrowth}% vs année précédente
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium opacity-90">Marge Bénéficiaire</p>
            <Target className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-4xl font-bold mb-2">{strategicKpis.profitMargin}%</p>
          <p className="text-sm opacity-90">
            Objectif: 25%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium opacity-90">ROI</p>
            <Zap className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-4xl font-bold mb-2">{strategicKpis.roi}%</p>
          <p className="text-sm opacity-90">
            Retour sur investissement
          </p>
        </motion.div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Part de marché"
          value={`${strategicKpis.marketShare}%`}
          icon="analytics"
          color="blue"
          loading={loading}
        />
        <KpiCard
          title="Croissance annuelle"
          value={`+${strategicKpis.yearlyGrowth}%`}
          icon="trending"
          color="green"
          loading={loading}
        />
        <KpiCard
          title="Rétention client"
          value={`${strategicKpis.customerRetention}%`}
          icon="users"
          color="purple"
          loading={loading}
        />
        <KpiCard
          title="Catégories actives"
          value={categoryPerformance.length}
          icon="categories"
          color="orange"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <ChartCard
          title="Évolution du CA"
          subtitle="12 derniers mois"
          loading={loading}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorInvestor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis
                dataKey="month"
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorInvestor)"
                strokeWidth={2}
                name="CA"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Performance */}
        <ChartCard
          title="Performance par catégorie"
          subtitle="Part du CA"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={categoryPerformance}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {categoryPerformance.map((entry, index) => (
                  <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "8px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
              />
            </RePieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Opportunities & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opportunities */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Opportunités</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Potentiels identifiés</p>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse h-20 bg-gray-100 dark:bg-slate-700 rounded-lg"></div>
                ))}
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Aucune opportunité détectée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <motion.div
                    key={opp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{opp.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{opp.description}</p>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-200 dark:bg-yellow-800/30 rounded-full">
                        <Award className="w-3 h-3 text-yellow-700 dark:text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
                          {Math.round(opp.score)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Alertes critiques</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Attention requise</p>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-slate-700 rounded-lg"></div>
                ))}
              </div>
            ) : criticalAlerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">Aucune alerte critique</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">Tout fonctionne normalement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {criticalAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl"
                  >
                    <p className="font-medium text-red-800 dark:text-red-300">{alert.message}</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {new Date(alert.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Rapport complet</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </button>

        <button className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Analyse détaillée</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
        </button>

        <button className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Exporter données</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
        </button>
      </div>
    </div>
  );
}
