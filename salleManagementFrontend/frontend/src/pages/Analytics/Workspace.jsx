import { useEffect, useState } from "react";
import {
    Briefcase,
    LayoutDashboard,
    Plus,
    X,
    GripVertical,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Package,
    FolderTree,
    Users,
    BarChart3,
    PieChart,
    Activity,
    RefreshCw,
    Settings,
    Eye,
    EyeOff,
    Maximize2,
    Save,
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart as RechartsPie,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

import { getSales } from "../../services/salesService";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { useDarkMode } from "../../context/DarkModeContext";

const AIRBNB_COLORS = ['#FF5A5F', '#00A699', '#FC642D', '#FFB400', '#767676', '#914669'];

// Available widget types
const WIDGET_TYPES = [
    { id: 'revenue-trend', name: 'Revenue Trend', icon: TrendingUp, size: 'large' },
    { id: 'sales-pie', name: 'Sales by Category', icon: PieChart, size: 'medium' },
    { id: 'top-products', name: 'Top Products', icon: Package, size: 'medium' },
    { id: 'kpi-revenue', name: 'KPI: Revenue', icon: DollarSign, size: 'small' },
    { id: 'kpi-sales', name: 'KPI: Sales Count', icon: ShoppingCart, size: 'small' },
    { id: 'kpi-products', name: 'KPI: Products', icon: Package, size: 'small' },
    { id: 'kpi-categories', name: 'KPI: Categories', icon: FolderTree, size: 'small' },
    { id: 'daily-bar', name: 'Daily Sales Bar', icon: BarChart3, size: 'large' },
];

export default function Workspace() {
    const { darkMode } = useDarkMode();
    const [loading, setLoading] = useState(true);
    const [showWidgetPicker, setShowWidgetPicker] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Active widgets
    const [widgets, setWidgets] = useState(() => {
        const saved = localStorage.getItem('workspace-widgets');
        return saved ? JSON.parse(saved) : [
            { id: 'kpi-revenue', visible: true },
            { id: 'kpi-sales', visible: true },
            { id: 'kpi-products', visible: true },
            { id: 'kpi-categories', visible: true },
            { id: 'revenue-trend', visible: true },
            { id: 'sales-pie', visible: true },
            { id: 'top-products', visible: true },
        ];
    });

    // Data
    const [data, setData] = useState({
        totalRevenue: 0,
        totalSales: 0,
        totalProducts: 0,
        totalCategories: 0,
        salesTrend: [],
        categoryStats: [],
        topProducts: [],
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        localStorage.setItem('workspace-widgets', JSON.stringify(widgets));
    }, [widgets]);

    const loadData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [salesRes, productsRes, categoriesRes] = await Promise.all([
                getSales().catch(() => ({ data: [] })),
                getProducts().catch(() => ({ data: [] })),
                getCategories().catch(() => ({ data: [] })),
            ]);

            const sales = Array.isArray(salesRes?.data) ? salesRes.data : [];
            const products = Array.isArray(productsRes?.data) ? productsRes.data : [];
            const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];

            // KPIs
            const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s?.totalAmount || 0), 0);

            // Daily trend
            const dailyMap = {};
            sales.forEach(sale => {
                const date = (sale?.saleDate || sale?.createdAt || '').split('T')[0];
                if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, orders: 0 };
                dailyMap[date].revenue += parseFloat(sale?.totalAmount || 0);
                dailyMap[date].orders += 1;
            });

            // Category stats
            const catMap = {};
            categories.forEach(cat => {
                catMap[cat.id] = { name: cat.name, value: 0 };
            });
            sales.forEach(sale => {
                (sale?.lignes || []).forEach(ligne => {
                    const prod = products.find(p => p.id === ligne?.productId);
                    if (prod && catMap[prod.categoryId]) {
                        catMap[prod.categoryId].value += parseFloat(ligne?.quantity || 1) * parseFloat(ligne?.unitPrice || 0);
                    }
                });
            });

            // Top products
            const prodMap = {};
            sales.forEach(sale => {
                (sale?.lignes || []).forEach(ligne => {
                    const name = ligne?.productTitle || 'Unknown';
                    if (!prodMap[name]) prodMap[name] = { name, sales: 0, revenue: 0 };
                    prodMap[name].sales += parseFloat(ligne?.quantity || 1);
                    prodMap[name].revenue += parseFloat(ligne?.quantity || 1) * parseFloat(ligne?.unitPrice || 0);
                });
            });

            setData({
                totalRevenue,
                totalSales: sales.length,
                totalProducts: products.length,
                totalCategories: categories.length,
                salesTrend: Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14),
                categoryStats: Object.values(catMap).filter(c => c.value > 0).slice(0, 6),
                topProducts: Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
            });

        } catch (error) {
            console.error("Workspace error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const toggleWidget = (widgetId) => {
        setWidgets(prev => {
            const exists = prev.find(w => w.id === widgetId);
            if (exists) {
                return prev.map(w => w.id === widgetId ? { ...w, visible: !w.visible } : w);
            } else {
                return [...prev, { id: widgetId, visible: true }];
            }
        });
    };

    const removeWidget = (widgetId) => {
        setWidgets(prev => prev.filter(w => w.id !== widgetId));
    };

    const addWidget = (widgetId) => {
        if (!widgets.find(w => w.id === widgetId)) {
            setWidgets(prev => [...prev, { id: widgetId, visible: true }]);
        }
        setShowWidgetPicker(false);
    };

    const resetWidgets = () => {
        const defaultWidgets = [
            { id: 'kpi-revenue', visible: true },
            { id: 'kpi-sales', visible: true },
            { id: 'kpi-products', visible: true },
            { id: 'kpi-categories', visible: true },
            { id: 'revenue-trend', visible: true },
            { id: 'sales-pie', visible: true },
        ];
        setWidgets(defaultWidgets);
    };

    const renderWidget = (widget) => {
        if (!widget.visible) return null;

        const widgetType = WIDGET_TYPES.find(w => w.id === widget.id);
        if (!widgetType) return null;

        switch (widget.id) {
            case 'kpi-revenue':
                return <KPIWidget icon={DollarSign} title="Total Revenue" value={`$${data.totalRevenue.toFixed(2)}`} color="coral" darkMode={darkMode} onRemove={() => removeWidget(widget.id)} />;
            case 'kpi-sales':
                return <KPIWidget icon={ShoppingCart} title="Total Sales" value={data.totalSales} color="teal" darkMode={darkMode} onRemove={() => removeWidget(widget.id)} />;
            case 'kpi-products':
                return <KPIWidget icon={Package} title="Products" value={data.totalProducts} color="arches" darkMode={darkMode} onRemove={() => removeWidget(widget.id)} />;
            case 'kpi-categories':
                return <KPIWidget icon={FolderTree} title="Categories" value={data.totalCategories} color="hof" darkMode={darkMode} onRemove={() => removeWidget(widget.id)} />;
            case 'revenue-trend':
                return <ChartWidget title="Revenue Trend" icon={TrendingUp} darkMode={darkMode} onRemove={() => removeWidget(widget.id)}>
                    <AreaChart data={data.salesTrend}>
                        <defs>
                            <linearGradient id="workspaceRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#404040' : '#E5E5E5'} />
                        <XAxis dataKey="date" tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 10 }} />
                        <YAxis tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#262626' : '#fff', border: 'none', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#FF5A5F" fill="url(#workspaceRevenue)" strokeWidth={2} />
                    </AreaChart>
                </ChartWidget>;
            case 'sales-pie':
                return <ChartWidget title="Sales by Category" icon={PieChart} darkMode={darkMode} onRemove={() => removeWidget(widget.id)}>
                    <RechartsPie>
                        <Pie data={data.categoryStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                            {data.categoryStats.map((_, i) => <Cell key={i} fill={AIRBNB_COLORS[i % AIRBNB_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </RechartsPie>
                </ChartWidget>;
            case 'top-products':
                return <ChartWidget title="Top Products" icon={Package} darkMode={darkMode} onRemove={() => removeWidget(widget.id)}>
                    <BarChart data={data.topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#404040' : '#E5E5E5'} />
                        <XAxis type="number" tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#262626' : '#fff', border: 'none', borderRadius: '12px' }} />
                        <Bar dataKey="revenue" fill="#00A699" radius={[0, 6, 6, 0]} />
                    </BarChart>
                </ChartWidget>;
            case 'daily-bar':
                return <ChartWidget title="Daily Orders" icon={BarChart3} darkMode={darkMode} onRemove={() => removeWidget(widget.id)}>
                    <BarChart data={data.salesTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#404040' : '#E5E5E5'} />
                        <XAxis dataKey="date" tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 10 }} />
                        <YAxis tick={{ fill: darkMode ? '#A3A3A3' : '#767676', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#262626' : '#fff', border: 'none', borderRadius: '12px' }} />
                        <Bar dataKey="orders" fill="#FC642D" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ChartWidget>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-coral-50/20'}`}>
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-coral-200 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className={`font-medium ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>Loading workspace...</p>
                </div>
            </div>
        );
    }

    const visibleWidgets = widgets.filter(w => w.visible);
    const kpiWidgets = visibleWidgets.filter(w => w.id.startsWith('kpi-'));
    const chartWidgets = visibleWidgets.filter(w => !w.id.startsWith('kpi-'));

    return (
        <div className={`min-h-screen p-6 ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-coral-50/20'}`}>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className={`text-3xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                            <Briefcase className="w-8 h-8 text-teal-500" />
                            Custom Workspace
                        </h1>
                        <p className={`mt-1 ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>
                            Customize your dashboard with widgets
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => loadData(true)}
                            disabled={refreshing}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${darkMode
                                    ? 'bg-warm-800 border-warm-700 text-warm-300 hover:bg-warm-700'
                                    : 'bg-white border-warm-200 text-warm-600 hover:bg-warm-50'
                                }`}
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        <button
                            onClick={resetWidgets}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${darkMode
                                    ? 'bg-warm-800 border-warm-700 text-warm-300 hover:bg-warm-700'
                                    : 'bg-white border-warm-200 text-warm-600 hover:bg-warm-50'
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            Reset
                        </button>

                        <button
                            onClick={() => setShowWidgetPicker(true)}
                            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 text-sm font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            Add Widget
                        </button>
                    </div>
                </div>

                {/* KPI Widgets */}
                {kpiWidgets.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {kpiWidgets.map(widget => (
                            <div key={widget.id}>{renderWidget(widget)}</div>
                        ))}
                    </div>
                )}

                {/* Chart Widgets */}
                {chartWidgets.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {chartWidgets.map(widget => (
                            <div key={widget.id}>{renderWidget(widget)}</div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {visibleWidgets.length === 0 && (
                    <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-warm-900 border-warm-700' : 'bg-white border-warm-300'
                        }`}>
                        <LayoutDashboard className={`w-16 h-16 mb-4 ${darkMode ? 'text-warm-600' : 'text-warm-300'}`} />
                        <p className={`text-lg mb-2 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
                            Your workspace is empty
                        </p>
                        <p className={`text-sm mb-6 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>
                            Add widgets to customize your dashboard
                        </p>
                        <button
                            onClick={() => setShowWidgetPicker(true)}
                            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition shadow-lg"
                        >
                            Add Widgets
                        </button>
                    </div>
                )}

                {/* Widget Picker Modal */}
                {showWidgetPicker && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className={`w-full max-w-lg rounded-2xl p-6 ${darkMode ? 'bg-warm-900' : 'bg-white'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>Add Widget</h2>
                                <button onClick={() => setShowWidgetPicker(false)} className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-warm-800' : 'hover:bg-warm-100'}`}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {WIDGET_TYPES.map(type => {
                                    const isActive = widgets.find(w => w.id === type.id && w.visible);
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => addWidget(type.id)}
                                            disabled={isActive}
                                            className={`p-4 rounded-xl border text-left transition-all ${isActive
                                                    ? darkMode ? 'bg-warm-800 border-warm-700 opacity-50' : 'bg-warm-100 border-warm-200 opacity-50'
                                                    : darkMode ? 'bg-warm-800 border-warm-700 hover:border-teal-500' : 'bg-white border-warm-200 hover:border-teal-500'
                                                }`}
                                        >
                                            <type.icon className={`w-6 h-6 mb-2 ${isActive ? 'text-warm-400' : 'text-teal-500'}`} />
                                            <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-warm-900'}`}>{type.name}</p>
                                            <p className={`text-xs ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>{type.size}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function KPIWidget({ icon: Icon, title, value, color, darkMode, onRemove }) {
    const colorClasses = {
        coral: 'from-coral-500 to-coral-600',
        teal: 'from-teal-500 to-teal-600',
        arches: 'from-arches-500 to-arches-600',
        hof: 'from-hof-400 to-hof-500',
    };

    return (
        <div className={`rounded-2xl border p-5 transition-all hover:shadow-lg relative group ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
            <button
                onClick={onRemove}
                className={`absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'hover:bg-warm-800' : 'hover:bg-warm-100'
                    }`}
            >
                <X className="w-4 h-4 text-warm-400" />
            </button>
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

function ChartWidget({ title, icon: Icon, children, darkMode, onRemove }) {
    return (
        <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg relative group ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
            <button
                onClick={onRemove}
                className={`absolute top-4 right-4 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'hover:bg-warm-800' : 'hover:bg-warm-100'
                    }`}
            >
                <X className="w-4 h-4 text-warm-400" />
            </button>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-warm-900'}`}>
                <Icon className="w-5 h-5 text-teal-500" />
                {title}
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
