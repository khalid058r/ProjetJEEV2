import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  CubeIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { getSale } from "../services/salesService";
import { generateInvoicePDF } from "../utils/invoicePdf";
import { useToast } from "../components/Toast";

export default function SaleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSale();
  }, [id]);

  const loadSale = async () => {
    try {
      setLoading(true);
      const res = await getSale(id);
      let saleData = { ...res.data };

      // Get extra info from localStorage (if exists)
      const extra = JSON.parse(localStorage.getItem(`sale-extra-${id}`));
      if (extra) {
        saleData.clientName = extra.clientName;
        saleData.cart = extra.cart;
        saleData.total = extra.total;
      } else {
        saleData.clientName = saleData.clientName || "Walk-in Customer";
        saleData.cart = saleData.lignes;
        saleData.total = saleData.totalAmount;
      }

      setSale(saleData);
    } catch (err) {
      console.error(err);
      showToast("Failed to load sale details", "error");
      navigate("/admin/sales");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = () => {
    try {
      generateInvoicePDF(sale);
      showToast("Invoice PDF generated successfully", "success");
    } catch (err) {
      showToast("Failed to generate PDF", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mb-4"></div>
        <p className="text-gray-500">Loading sale details...</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 text-lg mb-4">Sale not found</p>
        <button
          onClick={() => navigate("/admin/sales")}
          className="text-blue-600 hover:underline"
        >
          Back to Sales
        </button>
      </div>
    );
  }

  const totalItems = sale.lignes.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = sale.lignes.reduce((sum, l) => sum + l.lineTotal, 0);
  const tax = subtotal * 0.2; // 20% TVA
  const total = subtotal + tax;

  const statusColors = {
    COMPLETED: "bg-green-100 text-green-700 border-green-200",
    PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 p-8">

      {/* BREADCRUMB */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin/sales")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Sales</span>
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <ShoppingCartIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Sale #{sale.id}</h1>
              <p className="text-green-100">Invoice Details</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGeneratePDF}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition"
            >
              <DocumentArrowDownIcon className="h-5 w-5 text-white" />
              <span className="text-white font-semibold">Download PDF</span>
            </button>

            <button
              onClick={handleGeneratePDF}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition"
              title="Print Invoice"
            >
              <PrinterIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8">

          {/* SALE INFO CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

            <InfoCard
              icon={<CalendarIcon className="h-6 w-6" />}
              label="Date"
              value={new Date(sale.saleDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              color="blue"
            />

            <InfoCard
              icon={<UserIcon className="h-6 w-6" />}
              label="Client"
              value={sale.clientName}
              color="purple"
            />

            <InfoCard
              icon={<ShoppingCartIcon className="h-6 w-6" />}
              label="Total Items"
              value={totalItems}
              color="orange"
            />

            <div className={`p-5 rounded-xl border-2 ${statusColors[sale.status] || statusColors.COMPLETED}`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="h-6 w-6" />
                <span className="text-sm font-semibold">Status</span>
              </div>
              <p className="text-2xl font-bold">{sale.status}</p>
            </div>
          </div>

          {/* PRODUCTS TABLE */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CubeIcon className="h-7 w-7 text-green-600" />
              Products
            </h2>

            <div className="bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Product</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Quantity</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Unit Price</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sale.lignes.map((ligne, idx) => (
                    <tr key={idx} className="hover: bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-lg flex items-center justify-center text-white font-bold">
                            {idx + 1}
                          </div>
                          <span className="font-semibold text-gray-900">{ligne.productTitle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                          {ligne.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        ${ligne.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-green-600">
                          ${ligne.lineTotal.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PRICING SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left:  Distribution Chart */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Product Distribution</h3>
              <SaleDonutChart lignes={sale.lignes} />
              <div className="mt-4 space-y-2">
                {sale.lignes.map((ligne, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][idx % 4] }}></div>
                      <span className="text-gray-700">{ligne.productTitle}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{ligne.quantity} units</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Total Calculation */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Invoice Summary</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="text-xl font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                  <span className="text-gray-700">Tax (TVA 20%)</span>
                  <span className="text-xl font-semibold text-gray-900">${tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-2xl font-bold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-green-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-300">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Payment Method</span>
                  <span className="font-semibold text-gray-900">Cash</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                  <span>Seller</span>
                  <span className="font-semibold text-gray-900">{sale.username}</span>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-8 pt-6 border-t flex justify-between items-center">
            <button
              onClick={() => navigate("/admin/sales")}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Sales
            </button>

            <button
              onClick={handleGeneratePDF}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition font-semibold"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Download Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------
    COMPONENTS
------------------------------------------ */

function InfoCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200",
    orange: "text-orange-600 bg-orange-50 border-orange-200",
    green: "text-green-600 bg-green-50 border-green-200",
  };

  return (
    <div className={`p-5 rounded-xl border-2 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={colorClasses[color].split(' ')[0]}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
    </div>
  );
}

function SaleDonutChart({ lignes }) {
  const total = lignes.reduce((s, l) => s + l.quantity, 0);
  let offset = 0;
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <svg viewBox="0 0 36 36" className="w-48 h-48 mx-auto transform rotate-[-90deg]">
      {lignes.map((l, i) => {
        const pct = (l.quantity / total) * 100;
        const circle = (
          <circle
            key={i}
            r="16"
            cx="18"
            cy="18"
            fill="transparent"
            stroke={colors[i % colors.length]}
            strokeWidth="5"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeDashoffset={-offset}
            className="transition-all duration-500"
          />
        );
        offset += pct;
        return circle;
      })}
      <circle r="12" cx="18" cy="18" fill="white" />
    </svg>
  );
}