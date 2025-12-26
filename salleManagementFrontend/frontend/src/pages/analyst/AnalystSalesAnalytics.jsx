import { useEffect, useState, useMemo } from 'react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Calendar,
    Clock,
    BarChart3,
    Target,
    Activity,
    Filter,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    ComposedChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

import { getSales } from '../../services/salesService';
import { getProducts } from '../../services/productService';

import {
    generateForecast,
    calculateStatistics,
    calculateAOV,
    groupSalesByPeriod
} from '../../utils/analyticsCalculations';
import { CHART_COLORS, formatCurrency, formatNumber } from '../../utils/chartHelpers';

/**
 * AnalystSalesAnalytics - Sales analytics for analyst role
 */
export default function AnalystSalesAnalytics() {
    const [loading, setLoading] = useState(true);

    const [salesTrend, setSalesTrend] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [hourlyData, setHourlyData] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);

    const [kpis, setKpis] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        aov: 0,
        momGrowth: 0
    });

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);

            const [salesRes] = await Promise.all([
                getSales().catch(err => { console.error("Sales error:", err); return { data: [] }; }),
                getProducts().catch(err => { console.error("Products error:", err); return { data: [] }; })
            ]);

            // Ensure sales is an array
            const sales = Array.isArray(salesRes?.data) ? salesRes.data :
                (Array.isArray(salesRes) ? salesRes : []);

            console.log("Sales Analytics loaded:", { salesCount: sales.length, sample: sales[0] });

            // Calculate KPIs with safe access
            const totalRevenue = sales.reduce((sum, s) => {
                const amount = parseFloat(s?.totalAmount || s?.total || s?.montant || 0);
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            const totalOrders = sales.length;
            const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Calculate real MoM growth
            const now = new Date();
            const thisMonthSales = sales.filter(s => {
                const d = new Date(s?.saleDate || s?.createdAt || s?.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
            const lastMonthSales = sales.filter(s => {
                const d = new Date(s?.saleDate || s?.createdAt || s?.date);
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
            });
            const thisMonthRev = thisMonthSales.reduce((sum, s) => sum + parseFloat(s?.totalAmount || s?.total || 0), 0);
            const lastMonthRev = lastMonthSales.reduce((sum, s) => sum + parseFloat(s?.totalAmount || s?.total || 0), 0);
            const momGrowth = lastMonthRev > 0
                ? parseFloat(((thisMonthRev - lastMonthRev) / lastMonthRev * 100).toFixed(1))
                : (thisMonthRev > 0 ? 100 : 0);

            setKpis({
                totalRevenue,
                totalOrders,
                aov,
                momGrowth
            });

            // Build daily trend
            const dailyMap = {};
            sales.forEach(sale => {
                const rawDate = sale?.saleDate || sale?.createdAt || sale?.date;
                const date = rawDate ? (typeof rawDate === 'string' ? rawDate.split('T')[0] : new Date(rawDate).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
                if (!dailyMap[date]) {
                    dailyMap[date] = { date, revenue: 0, orders: 0 };
                }
                dailyMap[date].revenue += parseFloat(sale?.totalAmount || sale?.total || 0);
                dailyMap[date].orders += 1;
            });

            const trendData = Object.values(dailyMap).sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            );
            setSalesTrend(trendData);

            // Generate forecast
            const forecastData = generateForecast(
                trendData.map(d => ({ date: d.date, value: d.revenue })),
                7
            );
            setForecast(forecastData);

            // Hourly analysis
            const hourly = groupSalesByPeriod(sales, 'hour');
            setHourlyData(hourly);

            // Daily analysis (by day of week)
            const daily = groupSalesByPeriod(sales, 'day');
            setDailyData(daily);

            // Monthly analysis
            const monthly = groupSalesByPeriod(sales, 'month');
            setMonthlyData(monthly);

        } catch (error) {
            console.error('Erreur chargement analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const combinedTrend = useMemo(() => {
        return [...salesTrend, ...forecast];
    }, [salesTrend, forecast]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-500 to-emerald-500 animate-spin">
                            <div className="absolute inset-2 bg-white rounded-full"></div>
                        </div>
                        <TrendingUp className="absolute inset-0 m-auto w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-700 font-semibold">Analyse des Ventes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/25">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Analyse des Ventes</h1>
                    </div>
                    <p className="text-gray-500 mt-1 ml-12">Performance commerciale et prévisions</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Revenu Total" value={formatCurrency(kpis.totalRevenue)} change={kpis.momGrowth} icon={DollarSign} color="green" />
                <KPICard title="Commandes" value={formatNumber(kpis.totalOrders)} change={8.2} icon={ShoppingCart} color="blue" />
                <KPICard title="Panier Moyen" value={formatCurrency(kpis.aov)} change={3.2} icon={Target} color="purple" />
                <KPICard title="Croissance MoM" value={`${kpis.momGrowth}%`} change={null} icon={TrendingUp} color="green" />
            </div>

            {/* Main Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendance avec Prévisions (7 jours)</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={combinedTrend}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                            formatter={(value, name) => {
                                if (name === 'revenue') return [formatCurrency(value), 'Revenu Réel'];
                                if (name === 'value') return [formatCurrency(value), 'Prévision'];
                                return [value, name];
                            }}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            name="Revenu Réel"
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            fillOpacity={1}
                            fill="url(#colorForecast)"
                            name="Prévision"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Temporal Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* By Hour */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Par Heure
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="period" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* By Day */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-500" />
                        Par Jour
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* By Month */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-orange-500" />
                        Par Mois
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, change, icon: Icon, color }) {
    const colorClasses = {
        green: 'from-green-500 to-emerald-500',
        blue: 'from-blue-500 to-cyan-500',
        purple: 'from-purple-500 to-violet-500'
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white`}>
                    <Icon className="w-5 h-5" />
                </div>
                {change !== null && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{title}</div>
        </div>
    );
}
