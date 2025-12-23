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

export default function Sales() {
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
    return saleDate. toDateString() === today.toDateString();
  }).length;

  // Filtering
  const filteredSales = sales
    .filter(s =>
      s.username?. toLowerCase().includes(search.toLowerCase()) ||
      s.clientName?. toLowerCase().includes(search.toLowerCase()) ||
      s.id. toString().includes(search)
    )
    .filter(s => {
      if (dateFilter === "today") {
        const saleDate = new Date(s. saleDate);
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
    .filter(s => statusFilter === "all" ?  true : s.status === statusFilter);

  const statusColors = {
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Loading sales...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 p-8">
      
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <ShoppingCartIcon className="h-10 w-10 text-green-600" />
              Sales Management
            </h1>
            <p className="text-gray-600">Track and manage all sales transactions</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200"
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
            color="green"
          />
          <KpiCard
            icon={<ShoppingCartIcon className="h-6 w-6" />}
            label="Total Sales"
            value={totalSales}
            color="blue"
          />
          <KpiCard
            icon={<ChartBarIcon className="h-6 w-6" />}
            label="Avg Order Value"
            value={`$${avgOrderValue.toFixed(2)}`}
            color="purple"
          />
          <KpiCard
            icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
            label="Today's Sales"
            value={todaySales}
            color="orange"
          />
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by ID, client, or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2. 5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition bg-white font-medium text-sm"
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
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition bg-white font-medium text-sm"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Active Filters */}
          {(search || dateFilter !== "all" || statusFilter !== "all") && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
              {search && (
                <FilterTag label={`Search: "${search}"`} onRemove={() => setSearch("")} />
              )}
              {dateFilter !== "all" && (
                <FilterTag label={`Date: ${dateFilter}`} onRemove={() => setDateFilter("all")} />
              )}
              {statusFilter !== "all" && (
                <FilterTag label={`Status: ${statusFilter}`} onRemove={() => setStatusFilter("all")} />
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredSales.length}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalSales}</span> sales
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
        />
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Sale ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Client</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">User</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    
                    {/* Sale ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        <span className="font-semibold text-gray-900">#{s.id}</span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">{s.clientName || "Walk-in"}</span>
                      </div>
                    </td>

                    {/* User */}
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{s.username}</span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">
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
                      <span className="text-lg font-bold text-green-600">
                        ${s.totalAmount.toFixed(2)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusColors[s. status] || statusColors.COMPLETED}`}>
                        {s.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/sales/${s.id}`)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => setConfirmDeleteId(s.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
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

function KpiCard({ icon, label, value, color }) {
  const colorClasses = {
    green: "text-green-600 bg-green-50 border-green-200",
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200",
    orange:  "text-orange-600 bg-orange-50 border-orange-200",
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 p-5 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
      {label}
      <button onClick={onRemove} className="hover:text-green-900">
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
      <ShoppingCartIcon className="h-16 w-16 text-gray-300 mb-4" />
      <p className="text-gray-500 text-lg mb-2">
        {hasFilters ? "No sales found" : "No sales yet"}
      </p>
      <p className="text-gray-400 text-sm mb-6">
        {hasFilters ?  "Try adjusting your filters" :  "Get started by creating your first sale"}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}