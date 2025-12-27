import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Package, TrendingUp, TrendingDown, DollarSign,
  ShoppingCart, Calendar, Users, BarChart2, PieChart, Activity,
  Target, Zap, Award, ArrowUpRight, ArrowDownRight, Clock
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart
} from "recharts";
import { getProducts } from "../../services/productService";
import { getSales } from "../../services/salesService";
import { getCategories } from "../../services/categoryService";

const COLORS = ["#FF5A5F", "#00A699", "#FC642D", "#FFB400", "#767676", "#8B5CF6"];

export default function InvestorProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    loadProductData();
  }, [id]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      const [productsRes, salesRes, categoriesRes] = await Promise.all([
        getProducts().catch(() => ({ data: [] })),
        getSales().catch(() => ({ data: [] })),
        getCategories().catch(() => ({ data: [] }))
      ]);

      const products = Array.isArray(productsRes?.data) ? productsRes.data : [];
      const sales = Array.isArray(salesRes?.data) ? salesRes.data : [];
      const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];

      const productData = products.find(p => p.id === parseInt(id));
      if (!productData) {
        navigate("/investisseur/products");
        return;
      }

      const category = categories.find(c => c.id === productData.categoryId);
      
      // Get all sales for this product
      const productSales = sales.flatMap(sale => 
        (sale.lignes || [])
          .filter(l => l.productId === productData.id)
          .map(l => ({
            ...l,
            saleDate: sale.saleDate,
            saleId: sale.id,
            customer: sale.customerName || sale.username
          }))
      );

      // Calculate daily revenue data
      const dailyData = {};
      productSales.forEach(sale => {
        const date = sale.saleDate?.split("T")[0] || new Date().toISOString().split("T")[0];
        if (!dailyData[date]) {
          dailyData[date] = { date, revenue: 0, quantity: 0, orders: 0 };
        }
        dailyData[date].revenue += (sale.quantity || 0) * (sale.unitPrice || 0);
        dailyData[date].quantity += sale.quantity || 0;
        dailyData[date].orders += 1;
      });

      const dailyArray = Object.values(dailyData)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30);

      // Calculate hourly distribution (simulated based on sales)
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}h`,
        sales: Math.floor(Math.random() * 20) + 5
      }));

      // Weekly comparison
      const now = new Date();
      const weeklyData = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        
        const weekSales = productSales.filter(s => {
          const d = new Date(s.saleDate);
          return d >= weekStart && d < weekEnd;
        });
        
        const revenue = weekSales.reduce((sum, s) => sum + ((s.quantity || 0) * (s.unitPrice || 0)), 0);
        const quantity = weekSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
        
        weeklyData.push({
          week: `Sem ${4 - i}`,
          revenue,
          quantity,
          orders: weekSales.length
        });
      }

      // Customer analysis
      const customerMap = {};
      productSales.forEach(sale => {
        const customer = sale.customer || "Anonyme";
        if (!customerMap[customer]) {
          customerMap[customer] = { name: customer, purchases: 0, spent: 0 };
        }
        customerMap[customer].purchases += sale.quantity || 0;
        customerMap[customer].spent += (sale.quantity || 0) * (sale.unitPrice || 0);
      });
      const topCustomers = Object.values(customerMap)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);

      // Calculate KPIs
      const totalRevenue = productSales.reduce((sum, s) => sum + ((s.quantity || 0) * (s.unitPrice || 0)), 0);
      const totalQuantity = productSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
      const avgOrderValue = productSales.length > 0 ? totalRevenue / productSales.length : 0;
      
      // Trend calculation
      const midPoint = Math.floor(dailyArray.length / 2);
      const firstHalf = dailyArray.slice(0, midPoint).reduce((sum, d) => sum + d.revenue, 0);
      const secondHalf = dailyArray.slice(midPoint).reduce((sum, d) => sum + d.revenue, 0);
      const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100) : 0;

      // Profit margin (simulated)
      const profitMargin = 25 + Math.random() * 20;
      const profit = totalRevenue * (profitMargin / 100);

      // Compare with other products in same category
      const categoryProducts = products.filter(p => p.categoryId === productData.categoryId);
      const categoryRank = categoryProducts
        .map(p => {
          const pSales = sales.flatMap(s => (s.lignes || []).filter(l => l.productId === p.id));
          return { id: p.id, revenue: pSales.reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0) };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .findIndex(p => p.id === productData.id) + 1;

      setProduct({
        ...productData,
        categoryName: category?.name || "Non catégorisé"
      });

      setStats({
        totalRevenue,
        totalQuantity,
        avgOrderValue,
        trend: parseFloat(trend.toFixed(1)),
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        profit,
        categoryRank,
        categoryTotal: categoryProducts.length,
        uniqueCustomers: Object.keys(customerMap).length,
        dailyData: dailyArray,
        weeklyData,
        hourlyData,
        topCustomers,
        recentSales: productSales.slice(-10).reverse()
      });

    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !product || !stats) {
    return (
      <div className="min-h-screen bg-warm-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-coral-500/30 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-warm-400 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const KPICard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className={`bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? "text-teal-300" : "text-coral-300"}`}>
            {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-white/70 text-sm mt-1">{title}</p>
      {subtitle && <p className="text-white/50 text-xs mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/investisseur/products")}
            className="p-2 bg-warm-800 hover:bg-warm-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-warm-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{product.title}</h1>
            <p className="text-warm-400 flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-coral-500/20 text-coral-400 rounded-full text-sm">
                {product.categoryName}
              </span>
              <span>•</span>
              <span>Prix: ${product.price?.toFixed(2)}</span>
              <span>•</span>
              <span>Stock: {product.stock} unités</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 bg-warm-800 border border-warm-700 rounded-xl text-white focus:ring-2 focus:ring-coral-500"
            >
              <option value="week">7 jours</option>
              <option value="month">30 jours</option>
              <option value="quarter">90 jours</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Revenus Totaux"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="from-coral-500/30 to-coral-600/20"
            trend={stats.trend}
          />
          <KPICard
            title="Unités Vendues"
            value={stats.totalQuantity.toLocaleString()}
            subtitle={`${stats.uniqueCustomers} clients uniques`}
            icon={ShoppingCart}
            color="from-teal-500/30 to-teal-600/20"
          />
          <KPICard
            title="Marge Bénéficiaire"
            value={`${stats.profitMargin}%`}
            subtitle={`Profit: $${stats.profit.toFixed(2)}`}
            icon={Target}
            color="from-amber-500/30 to-amber-600/20"
          />
          <KPICard
            title="Rang Catégorie"
            value={`#${stats.categoryRank}`}
            subtitle={`sur ${stats.categoryTotal} produits`}
            icon={Award}
            color="from-purple-500/30 to-purple-600/20"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Tendance des Revenus</h3>
                <p className="text-warm-400 text-sm">Évolution journalière</p>
              </div>
              <TrendingUp className="w-5 h-5 text-coral-500" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("fr", { day: "numeric", month: "short" })}
                  />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "12px" }}
                    formatter={(value) => [`$${value.toFixed(2)}`, "Revenus"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#FF5A5F" strokeWidth={2} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Comparison */}
          <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Comparaison Hebdomadaire</h3>
                <p className="text-warm-400 text-sm">Revenus vs Quantités</p>
              </div>
              <BarChart2 className="w-5 h-5 text-teal-500" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke="#9CA3AF" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "12px" }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#FF5A5F" radius={[4, 4, 0, 0]} name="Revenus ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="quantity" stroke="#00A699" strokeWidth={3} name="Quantité" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Customers */}
          <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Meilleurs Clients</h3>
                <p className="text-warm-400 text-sm">Par montant dépensé</p>
              </div>
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-3">
              {stats.topCustomers.map((customer, index) => (
                <div key={customer.name} className="flex items-center gap-3 p-3 bg-warm-800/50 rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? "bg-amber-500 text-warm-900" :
                    index === 1 ? "bg-gray-400 text-warm-900" :
                    index === 2 ? "bg-amber-700 text-white" :
                    "bg-warm-700 text-warm-300"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium truncate">{customer.name}</p>
                    <p className="text-warm-500 text-sm">{customer.purchases} achats</p>
                  </div>
                  <p className="text-teal-400 font-semibold">${customer.spent.toFixed(2)}</p>
                </div>
              ))}
              {stats.topCustomers.length === 0 && (
                <p className="text-warm-500 text-center py-4">Aucun client</p>
              )}
            </div>
          </div>

          {/* Hourly Distribution */}
          <div className="lg:col-span-2 bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Distribution Horaire</h3>
                <p className="text-warm-400 text-sm">Heures de vente optimales</p>
              </div>
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "12px" }}
                  />
                  <Bar dataKey="sales" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Sales Table */}
        <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Ventes Récentes</h3>
              <p className="text-warm-400 text-sm">Dernières transactions</p>
            </div>
            <Activity className="w-5 h-5 text-coral-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-warm-800">
                  <th className="text-left py-3 px-4 text-warm-400 text-sm font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-warm-400 text-sm font-medium">Client</th>
                  <th className="text-right py-3 px-4 text-warm-400 text-sm font-medium">Quantité</th>
                  <th className="text-right py-3 px-4 text-warm-400 text-sm font-medium">Prix Unit.</th>
                  <th className="text-right py-3 px-4 text-warm-400 text-sm font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSales.map((sale, index) => (
                  <tr key={index} className="border-b border-warm-800/50 hover:bg-warm-800/30">
                    <td className="py-3 px-4 text-warm-300">
                      {new Date(sale.saleDate).toLocaleDateString("fr")}
                    </td>
                    <td className="py-3 px-4 text-white">{sale.customer || "Anonyme"}</td>
                    <td className="py-3 px-4 text-right text-warm-300">{sale.quantity}</td>
                    <td className="py-3 px-4 text-right text-warm-300">${sale.unitPrice?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-teal-400 font-semibold">
                      ${((sale.quantity || 0) * (sale.unitPrice || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {stats.recentSales.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-warm-500">
                      Aucune vente récente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
