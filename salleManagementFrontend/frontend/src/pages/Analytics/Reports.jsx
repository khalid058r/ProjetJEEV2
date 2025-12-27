import { useEffect, useState, useRef } from "react";
import {
    FileText,
    Download,
    Filter,
    Calendar,
    TrendingUp,
    DollarSign,
    Package,
    ShoppingCart,
    BarChart3,
    PieChart,
    RefreshCw,
    Printer,
    FileSpreadsheet,
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart as RechartsPie,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { getSales } from "../../services/salesService";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { useDarkMode } from "../../context/DarkModeContext";

const AIRBNB_COLORS = ['#FF5A5F', '#00A699', '#FC642D', '#FFB400', '#767676', '#914669'];

export default function Reports() {
    const { darkMode } = useDarkMode();
    const reportRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [dateRange, setDateRange] = useState("month");

    const [kpis, setKpis] = useState({
        totalRevenue: 0,
        totalSales: 0,
        avgBasket: 0,
        totalProducts: 0,
    });
    const [salesTrend, setSalesTrend] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [monthlySales, setMonthlySales] = useState([]);

    useEffect(() => {
        loadReportData();
    }, [dateRange]);

    const loadReportData = async () => {
        setLoading(true);
        try {
            const [salesRes, productsRes, categoriesRes] = await Promise.all([
                getSales().catch(() => ({ data: [] })),
                getProducts().catch(() => ({ data: [] })),
                getCategories().catch(() => ({ data: [] })),
            ]);

            const sales = Array.isArray(salesRes?.data) ? salesRes.data : [];
            const products = Array.isArray(productsRes?.data) ? productsRes.data : [];
            const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];

            // Filter by date range
            const now = new Date();
            const filteredSales = sales.filter(s => {
                const saleDate = new Date(s?.saleDate || s?.createdAt);
                if (dateRange === "week") {
                    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                    return saleDate >= weekAgo;
                } else if (dateRange === "month") {
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    return saleDate >= monthAgo;
                } else if (dateRange === "year") {
                    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    return saleDate >= yearAgo;
                }
                return true;
            });

            // KPIs
            const totalRevenue = filteredSales.reduce((sum, s) => sum + parseFloat(s?.totalAmount || 0), 0);
            const totalSales = filteredSales.length;
            const avgBasket = totalSales > 0 ? totalRevenue / totalSales : 0;

            setKpis({
                totalRevenue,
                totalSales,
                avgBasket,
                totalProducts: products.length,
            });

            // Daily sales trend
            const dailyMap = {};
            filteredSales.forEach(sale => {
                const date = (sale?.saleDate || sale?.createdAt || '').split('T')[0];
                if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, orders: 0 };
                dailyMap[date].revenue += parseFloat(sale?.totalAmount || 0);
                dailyMap[date].orders += 1;
            });
            setSalesTrend(Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date)));

            // Category stats
            const catMap = {};
            categories.forEach(cat => {
                catMap[cat.id] = { name: cat.name, value: 0 };
            });
            filteredSales.forEach(sale => {
                (sale?.lignes || []).forEach(ligne => {
                    const prod = products.find(p => p.id === ligne?.productId);
                    if (prod && catMap[prod.categoryId]) {
                        catMap[prod.categoryId].value += parseFloat(ligne?.quantity || 1) * parseFloat(ligne?.unitPrice || 0);
                    }
                });
            });
            setCategoryStats(Object.values(catMap).filter(c => c.value > 0).slice(0, 6));

            // Top products
            const prodMap = {};
            filteredSales.forEach(sale => {
                (sale?.lignes || []).forEach(ligne => {
                    const name = ligne?.productTitle || 'Unknown';
                    if (!prodMap[name]) prodMap[name] = { name, quantity: 0, revenue: 0 };
                    prodMap[name].quantity += parseFloat(ligne?.quantity || 1);
                    prodMap[name].revenue += parseFloat(ligne?.quantity || 1) * parseFloat(ligne?.unitPrice || 0);
                });
            });
            setTopProducts(Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10));

            // Monthly sales
            const monthMap = {};
            sales.forEach(sale => {
                const date = new Date(sale?.saleDate || sale?.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!monthMap[monthKey]) monthMap[monthKey] = { month: monthKey, revenue: 0, orders: 0 };
                monthMap[monthKey].revenue += parseFloat(sale?.totalAmount || 0);
                monthMap[monthKey].orders += 1;
            });
            setMonthlySales(Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-12));

        } catch (error) {
            console.error("Report error:", error);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        if (!reportRef.current) return;
        setGenerating(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`report-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("PDF generation error:", error);
        } finally {
            setGenerating(false);
        }
    };

    const exportCSV = () => {
        const headers = ['Product', 'Quantity Sold', 'Revenue'];
        const rows = topProducts.map(p => [p.name, p.quantity, p.revenue.toFixed(2)]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-coral-50/20'}`}>
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-coral-200 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className={`font-medium ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>Generating report...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-6 ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-coral-50/20'}`}>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className={`text-3xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                            <FileText className="w-8 h-8 text-coral-500" />
                            Reports & Analytics
                        </h1>
                        <p className={`mt-1 ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>
                            Generate comprehensive business reports with visualizations
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Range Filter */}
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${darkMode
                                    ? 'bg-warm-800 border-warm-700 text-white'
                                    : 'bg-white border-warm-200 text-warm-900'
                                }`}
                        >
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="year">Last Year</option>
                            <option value="all">All Time</option>
                        </select>

                        {/* Export Buttons */}
                        <button
                            onClick={exportCSV}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:scale-105 ${darkMode
                                    ? 'bg-warm-800 border-warm-700 text-teal-400 hover:bg-warm-700'
                                    : 'bg-white border-warm-200 text-teal-600 hover:bg-teal-50'
                                }`}
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            CSV
                        </button>

                        <button
                            onClick={generatePDF}
                            disabled={generating}
                            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-coral-500 to-coral-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-coral-600 hover:to-coral-700 transform hover:scale-105 transition-all duration-200 text-sm font-semibold"
                        >
                            {generating ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div ref={reportRef} className="space-y-6">

                    {/* KPI Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard icon={DollarSign} title="Total Revenue" value={`$${kpis.totalRevenue.toFixed(2)}`} color="coral" darkMode={darkMode} />
                        <KPICard icon={ShoppingCart} title="Total Orders" value={kpis.totalSales} color="teal" darkMode={darkMode} />
                        <KPICard icon={TrendingUp} title="Avg. Basket" value={`$${kpis.avgBasket.toFixed(2)}`} color="arches" darkMode={darkMode} />
                        <KPICard icon={Package} title="Products" value={kpis.totalProducts} color="hof" darkMode={darkMode} />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Revenue Trend */}
                        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
                            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                                <TrendingUp className="w-5 h-5 text-coral-500" />
                                Revenue Trend
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesTrend}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#404040' : '#E5E5E5'} />
                                        <XAxis dataKey="date" tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 11 }} />
                                        <YAxis tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: darkMode ? '#262626' : '#fff',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#FF5A5F" fill="url(#colorRevenue)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Category Distribution */}
                        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
                            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                                <PieChart className="w-5 h-5 text-teal-500" />
                                Sales by Category
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={categoryStats}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {categoryStats.map((_, i) => (
                                                <Cell key={i} fill={AIRBNB_COLORS[i % AIRBNB_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Monthly Sales */}
                        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
                            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                                <BarChart3 className="w-5 h-5 text-arches-500" />
                                Monthly Performance
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlySales}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#404040' : '#E5E5E5'} />
                                        <XAxis dataKey="month" tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 11 }} />
                                        <YAxis tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: darkMode ? '#262626' : '#fff',
                                                border: 'none',
                                                borderRadius: '12px',
                                            }}
                                        />
                                        <Bar dataKey="revenue" fill="#FC642D" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
                            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                                <Package className="w-5 h-5 text-hof-500" />
                                Top Products
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topProducts} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#404040' : '#E5E5E5'} />
                                        <XAxis type="number" tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 11 }} />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: darkMode ? '#262626' : '#fff',
                                                border: 'none',
                                                borderRadius: '12px',
                                            }}
                                        />
                                        <Bar dataKey="revenue" fill="#FFB400" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* Products Table */}
                    <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
                        <div className={`p-4 border-b ${darkMode ? 'border-warm-800 bg-warm-800/50' : 'border-warm-100 bg-warm-50'}`}>
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                                Detailed Product Report
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className={darkMode ? 'bg-warm-800' : 'bg-warm-50'}>
                                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Product</th>
                                        <th className={`px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Qty Sold</th>
                                        <th className={`px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-warm-100 dark:divide-warm-800">
                                    {topProducts.map((product, idx) => (
                                        <tr key={idx} className={`transition-colors ${darkMode ? 'hover:bg-warm-800/50' : 'hover:bg-warm-50'}`}>
                                            <td className={`px-6 py-4 font-medium ${darkMode ? 'text-white' : 'text-warm-900'}`}>{product.name}</td>
                                            <td className={`px-6 py-4 text-right ${darkMode ? 'text-warm-300' : 'text-warm-600'}`}>{product.quantity}</td>
                                            <td className={`px-6 py-4 text-right font-semibold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>${product.revenue.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function KPICard({ icon: Icon, title, value, color, darkMode }) {
    const colorClasses = {
        coral: 'from-coral-500 to-coral-600',
        teal: 'from-teal-500 to-teal-600',
        arches: 'from-arches-500 to-arches-600',
        hof: 'from-hof-400 to-hof-500',
    };

    return (
        <div className={`rounded-2xl border p-5 transition-all hover:shadow-lg ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className={`text-sm ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>{title}</p>
                    <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{value}</p>
                </div>
            </div>
        </div>
    );
}
