import { useEffect, useState } from "react";
import { getSales, deleteSale } from "../services/salesService";
import { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import SaleFormModal from "../components/SaleFormModal";
import { useDarkMode } from "../context/DarkModeContext";

export default function Sales() {
  const { darkMode } = useDarkMode();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await getSales();
      setSales(res.data);
    } catch (err) {
      showToast("Failed to load sales", "error");
    }
    setLoading(false);
  };

  const confirmDelete = async () => {
    try {
      await deleteSale(confirmDeleteId);
      showToast("Sale deleted successfully", "success");
      setConfirmDeleteId(null);
      loadSales();
    } catch {
      showToast("Cannot delete sale", "error");
    }
  };

  // Calculate KPIs
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalSales = sales.length;
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const todaySales = sales.filter(s => {
    const saleDate = new Date(s.saleDate);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  }).length;

  // Filtering
  const filteredSales = sales
    .filter(s =>
      s.username?.toLowerCase().includes(search.toLowerCase()) ||
      s.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toString().includes(search)
    )
    .filter(s => {
      if (dateFilter === "today") {
        const saleDate = new Date(s.saleDate);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
      }
      if (dateFilter === "week") {
        const saleDate = new Date(s.saleDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return saleDate >= weekAgo;
      }
      if (dateFilter === "month") {
        const saleDate = new Date(s.saleDate);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return saleDate >= monthAgo;
      }
      return true;
    })
    .filter(s => statusFilter === "all" ? true : s.status === statusFilter);

  const statusColors = {
    COMPLETED: darkMode ? "bg-teal-500/20 text-teal-400" : "bg-teal-50 text-teal-700",
    PENDING: darkMode ? "bg-hof-400/20 text-hof-300" : "bg-hof-50 text-hof-600",
    CANCELLED: darkMode ? "bg-coral-500/20 text-coral-400" : "bg-coral-50 text-coral-600",
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-coral-50/20'}`}>
        <div className="relative">
          <div className="w-16 h-16 border-4 border-coral-200 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className={`mt-4 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Loading sales...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-coral-50/20'}`}>

      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-4xl font-bold mb-2 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-warm-900'}`}>
              <ShoppingCartIcon className="h-10 w-10 text-coral-500" />
              Sales Management
            </h1>
            <p className={darkMode ? 'text-warm-400' : 'text-warm-600'}>Track and manage all sales transactions</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-coral-500 to-coral-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-coral-600 hover:to-coral-700 transform hover:scale-105 transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="font-semibold">New Sale</span>
          </button>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            icon={<CurrencyDollarIcon className="h-6 w-6" />}
            label="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            color="coral"
            darkMode={darkMode}
          />
          <KpiCard
            icon={<ShoppingCartIcon className="h-6 w-6" />}
            label="Total Sales"
            value={totalSales}
            color="teal"
            darkMode={darkMode}
          />
          <KpiCard
            icon={<ChartBarIcon className="h-6 w-6" />}
            label="Avg Order Value"
            value={`$${avgOrderValue.toFixed(2)}`}
            color="arches"
            darkMode={darkMode}
          />
          <KpiCard
            icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
            label="Today's Sales"
            value={todaySales}
            color="hof"
            darkMode={darkMode}
          />
        </div>

        {/* FILTERS */}
        <div className={`rounded-2xl shadow-sm border p-6 ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className={`h-5 w-5 absolute left-3 top-3 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`} />
              <input
                type="text"
                placeholder="Search by ID, client, or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 focus:ring-2 focus:ring-coral-500 focus:border-transparent outline-none transition ${darkMode
                  ? 'bg-warm-800 border-warm-700 text-white placeholder-warm-500'
                  : 'bg-warm-50 border-warm-200 text-warm-900 placeholder-warm-400'
                  }`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={`absolute right-3 top-3 ${darkMode ? 'text-warm-500 hover:text-warm-300' : 'text-warm-400 hover:text-warm-600'}`}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-coral-500 outline-none transition font-medium text-sm ${darkMode
                ? 'bg-warm-800 border-warm-700 text-white'
                : 'bg-white border-warm-200 text-warm-700'
                }`}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-coral-500 outline-none transition font-medium text-sm ${darkMode
                ? 'bg-warm-800 border-warm-700 text-white'
                : 'bg-white border-warm-200 text-warm-700'
                }`}
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Active Filters */}
          {(search || dateFilter !== "all" || statusFilter !== "all") && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-warm-200 dark:border-warm-700">
              <span className={`text-sm font-medium ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>Active Filters:</span>
              {search && (
                <FilterTag label={`Search: "${search}"`} onRemove={() => setSearch("")} darkMode={darkMode} />
              )}
              {dateFilter !== "all" && (
                <FilterTag label={`Date: ${dateFilter}`} onRemove={() => setDateFilter("all")} darkMode={darkMode} />
              )}
              {statusFilter !== "all" && (
                <FilterTag label={`Status: ${statusFilter}`} onRemove={() => setStatusFilter("all")} darkMode={darkMode} />
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4">
          <p className={`text-sm ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>
            Showing <span className={`font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{filteredSales.length}</span> of{" "}
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{totalSales}</span> sales
          </p>
        </div>
      </div>

      {/* TABLE */}
      {filteredSales.length === 0 ? (
        <EmptyState
          hasFilters={search || dateFilter !== "all" || statusFilter !== "all"}
          onReset={() => {
            setSearch("");
            setDateFilter("all");
            setStatusFilter("all");
          }}
          darkMode={darkMode}
        />
      ) : (
        <div className={`rounded-2xl shadow-lg border overflow-hidden ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-warm-800' : 'bg-gradient-to-r from-coral-50 to-warm-50'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-warm-300' : 'text-warm-700'}`}>Sale ID</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-warm-300' : 'text-warm-700'}`}>Client</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-warm-300' : 'text-warm-700'}`}>User</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-warm-300' : 'text-warm-700'}`}>Date</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-warm-300' : 'text-warm-700'}`}>Total</th>
                  <th className={`px-6 py-4 text-left text-sm font-bold ${darkMode ? 'text-warm-300' : 'text-warm-700'}`}>Status</th>
                  <th className={`px-6 py-4 text-right text-sm font-bold ${darkMode ? 'text-warm-300' : 'text-warm-700'}`}>Actions</th>
                </tr>
              </thead>

              <tbody className={`divide-y ${darkMode ? 'divide-warm-800' : 'divide-warm-100'}`}>
                {filteredSales.map((s) => (
                  <tr key={s.id} className={`transition ${darkMode ? 'hover:bg-warm-800/50' : 'hover:bg-warm-50'}`}>

                    {/* Sale ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className={`h-5 w-5 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`} />
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-warm-900'}`}>#{s.id}</span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className={`h-5 w-5 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`} />
                        <span className={darkMode ? 'text-warm-300' : 'text-warm-700'}>{s.clientName || "Walk-in"}</span>
                      </div>
                    </td>

                    {/* User */}
                    <td className="px-6 py-4">
                      <span className={darkMode ? 'text-warm-300' : 'text-warm-700'}>{s.username}</span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className={`h-5 w-5 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`} />
                        <span className={darkMode ? 'text-warm-300' : 'text-warm-700'}>
                          {new Date(s.saleDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-coral-500">
                        ${s.totalAmount.toFixed(2)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusColors[s.status] || statusColors.COMPLETED}`}>
                        {s.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/sales/${s.id}`)}
                          className={`p-2 rounded-xl transition ${darkMode ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => setConfirmDeleteId(s.id)}
                          className={`p-2 rounded-xl transition ${darkMode ? 'bg-coral-500/20 text-coral-400 hover:bg-coral-500/30' : 'bg-coral-50 text-coral-600 hover:bg-coral-100'}`}
                          title="Delete Sale"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NEW SALE */}
      {showModal && (
        <SaleFormModal
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadSales();
          }}
        />
      )}

      {/* CONFIRM DELETE */}
      {confirmDeleteId && (
        <ConfirmModal
          title="Delete Sale"
          message="Are you sure you want to delete this sale?  This action cannot be undone."
          confirmLabel="Delete Sale"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

/* -----------------------------------------
    COMPONENTS
------------------------------------------ */

function KpiCard({ icon, label, value, color, darkMode }) {
  const colorClasses = {
    coral: { icon: "from-coral-500 to-coral-600", text: "text-coral-500" },
    teal: { icon: "from-teal-500 to-teal-600", text: "text-teal-500" },
    arches: { icon: "from-arches-500 to-arches-600", text: "text-arches-500" },
    hof: { icon: "from-hof-400 to-hof-500", text: "text-hof-500" },
  };

  const colors = colorClasses[color] || colorClasses.coral;

  return (
    <div className={`rounded-2xl shadow-sm border p-5 transition-all hover:shadow-lg ${darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'
      }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.icon} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
      <p className={`text-sm mb-1 ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>{label}</p>
      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{value}</p>
    </div>
  );
}

function FilterTag({ label, onRemove, darkMode }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${darkMode ? 'bg-coral-500/20 text-coral-400' : 'bg-coral-100 text-coral-700'
      }`}>
      {label}
      <button onClick={onRemove} className={darkMode ? 'hover:text-coral-300' : 'hover:text-coral-900'}>
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  );
}

function EmptyState({ hasFilters, onReset, darkMode }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-warm-900 border-warm-700' : 'bg-white border-warm-300'
      }`}>
      <ShoppingCartIcon className={`h-16 w-16 mb-4 ${darkMode ? 'text-warm-600' : 'text-warm-300'}`} />
      <p className={`text-lg mb-2 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>
        {hasFilters ? "No sales found" : "No sales yet"}
      </p>
      <p className={`text-sm mb-6 ${darkMode ? 'text-warm-500' : 'text-warm-400'}`}>
        {hasFilters ? "Try adjusting your filters" : "Get started by creating your first sale"}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          className="px-6 py-3 bg-gradient-to-r from-coral-500 to-coral-600 text-white rounded-xl hover:from-coral-600 hover:to-coral-700 transition shadow-lg"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}