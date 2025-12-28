import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  StarIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  TagIcon,
  CubeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  EyeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

import { getProduct, deleteProduct } from "../services/productService";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/Toast";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await getProduct(id);
      const p = res.data;
      p.gallery = [p.imageUrl, p.imageUrl, p.imageUrl];
      setProduct(p);
      setSelectedImage(p.imageUrl);
    } catch (err) {
      showToast("Failed to load product", "error");
      navigate("/admin/products");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(id);
      showToast("Product deleted successfully", "success");
      navigate("/admin/products");
    } catch (err) {
      showToast(err.response?.data?.message || "Cannot delete product", "error");
    }
  };

  const handleEdit = () => {
    navigate("/admin/products", { state: { editProductId: id } });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 text-lg mb-4">Product not found</p>
        <button
          onClick={() => navigate("/admin/products")}
          className="text-blue-600 hover:underline"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const stockStatus = product.stock > 50 ? "high" : product.stock > 10 ? "medium" : "low";
  const stockColor = {
    high: "text-green-600 bg-green-50 border-green-200",
    medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
    low: "text-red-600 bg-red-50 border-red-200",
  };

  // ✅ CALCULS POUR ADMIN (Inventory Value, Profit, etc.)
  const inventoryValue = (product.price * product.stock).toFixed(2);
  const estimatedProfit = (product.price * product.stock * 0.3).toFixed(2); // 30% margin

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-8">

      {/* BREADCRUMB */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Products</span>
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <CubeIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{product.title}</h1>
              <p className="text-blue-100">Product ID: #{product.id}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition"
            >
              <PencilSquareIcon className="h-5 w-5 text-white" />
              <span className="text-white font-semibold">Edit</span>
            </button>

            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-xl hover:bg-red-500/30 transition"
            >
              <TrashIcon className="h-5 w-5 text-white" />
              <span className="text-white font-semibold">Delete</span>
            </button>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">

          {/* LEFT:  IMAGE GALLERY */}
          <div className="space-y-4">
            <div className="relative group">
              <img
                src={selectedImage}
                alt={product.title}
                className="w-full h-[500px] object-cover rounded-2xl shadow-lg"
              />
              {product.stock < 10 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-2">
                  <XCircleIcon className="h-5 w-5" />
                  Low Stock Alert
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {product.gallery.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Gallery ${idx + 1}`}
                  className={`w-full h-24 object-cover rounded-lg cursor-pointer transition-all duration-300 ${selectedImage === img
                      ? "ring-4 ring-blue-500 scale-105"
                      : "hover:ring-2 hover:ring-gray-300 opacity-70 hover:opacity-100"
                    }`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>

            {/* ✅ ADMIN STATS - Pas client stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <AdminStatCard
                icon={<CurrencyDollarIcon className="h-5 w-5" />}
                label="Unit Price"
                value={`$${product.price}`}
                color="blue"
              />
              <AdminStatCard
                icon={<ArchiveBoxIcon className="h-5 w-5" />}
                label="In Stock"
                value={product.stock}
                color={stockStatus === "high" ? "green" : stockStatus === "medium" ? "yellow" : "red"}
              />
              <AdminStatCard
                icon={<ChartBarIcon className="h-5 w-5" />}
                label="Inventory Value"
                value={`$${inventoryValue}`}
                color="purple"
              />
            </div>
          </div>

          {/* RIGHT: ADMIN INFO */}
          <div className="space-y-6">

            {/* ✅ INVENTORY OVERVIEW - Pour Admin */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border-2 border-blue-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
                Inventory Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Unit Price</p>
                  <p className="text-3xl font-bold text-blue-600">${product.price}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">${inventoryValue}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Est. Profit (30%)</p>
                  <p className="text-xl font-bold text-green-600">${estimatedProfit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Units Available</p>
                  <p className="text-xl font-bold text-gray-900">{product.stock}</p>
                </div>
              </div>
            </div>

            {/* ✅ PRODUCT STATUS - Pour Admin */}
            <div className="grid grid-cols-2 gap-4">

              {/* Stock Status */}
              <div className={`p-5 rounded-xl border-2 ${stockColor[stockStatus]}`}>
                <div className="flex items-center gap-2 mb-2">
                  {product.stock > 10 ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : (
                    <XCircleIcon className="h-6 w-6" />
                  )}
                  <span className="font-bold">Stock Status</span>
                </div>
                <p className="text-3xl font-bold mb-1">{product.stock}</p>
                <p className="text-sm font-medium">
                  {stockStatus === "high" && "✅ Healthy Stock"}
                  {stockStatus === "medium" && "⚠️ Medium Stock"}
                  {stockStatus === "low" && "🚨 Restock Needed"}
                </p>
              </div>

              {/* Category */}
              <div className="p-5 bg-purple-50 text-purple-700 rounded-xl border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <TagIcon className="h-6 w-6" />
                  <span className="font-bold">Category</span>
                </div>
                <p className="text-2xl font-bold mb-1">{product.categoryName}</p>
                <button
                  onClick={() => navigate(`/admin/categories/${product.categoryId}`)}
                  className="text-sm font-medium hover:underline"
                >
                  View category →
                </button>
              </div>
            </div>

            {/* ✅ PRODUCT METRICS - Pour Admin */}
            {product.rating > 0 && (
              <div className="p-5 bg-amber-50 rounded-xl border-2 border-amber-200">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <StarSolid className="h-5 w-5 text-amber-500" />
                  Customer Feedback
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarSolid
                        key={star}
                        className={`h-7 w-7 ${star <= Math.round(product.rating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{product.rating.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">{product.reviewCount} reviews</p>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ PRODUCT METADATA - Pour Admin */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                Product Information
              </h3>

              <InfoRow label="Product ID" value={`#${product.id}`} />
              <InfoRow label="ASIN" value={product.asin || "Not set"} />
              <InfoRow label="Category" value={product.categoryName} />
              <InfoRow label="Unit Price" value={`$${product.price}`} />
              <InfoRow label="Current Stock" value={`${product.stock} units`} />
              <InfoRow label="Inventory Value" value={`$${inventoryValue}`} />
              {product.rank && <InfoRow label="Sales Rank" value={`#${product.rank}`} />}
              <InfoRow
                label="Last Updated"
                value={new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              />
            </div>

            {/* ✅ QUICK ACTIONS - Pour Admin */}
            <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <ActionButton
                  icon={<PencilSquareIcon className="h-5 w-5" />}
                  label="Edit Product"
                  onClick={handleEdit}
                  color="blue"
                />
                <ActionButton
                  icon={<EyeIcon className="h-5 w-5" />}
                  label="View Sales"
                  onClick={() => navigate(`/admin/sales?productId=${product.id}`)}
                  color="green"
                />
                <ActionButton
                  icon={<ChartBarIcon className="h-5 w-5" />}
                  label="Analytics"
                  onClick={() => navigate(`/admin/analytics/products`)}
                  color="purple"
                />
                <ActionButton
                  icon={<ClockIcon className="h-5 w-5" />}
                  label="History"
                  onClick={() => showToast("History feature coming soon", "info")}
                  color="gray"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-gray-50 px-8 py-6 border-t flex justify-between items-center">
          <button
            onClick={() => navigate("/admin/products")}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Products
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg"
            >
              <PencilSquareIcon className="h-5 w-5" />
              Edit Product
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-lg"
            >
              <TrashIcon className="h-5 w-5" />
              Delete Product
            </button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION */}
      {showDelete && (
        <ConfirmModal
          title="Delete Product"
          message={`Are you sure you want to delete "${product.title}"?  This action cannot be undone.`}
          confirmLabel="Delete Product"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

/* -----------------------------------------
    COMPONENTS
------------------------------------------ */

function AdminStatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    green: "text-green-600 bg-green-50 border-green-200",
    yellow: "text-yellow-600 bg-yellow-50 border-yellow-200",
    red: "text-red-600 bg-red-50 border-red-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200",
  };

  return (
    <div className={`p-4 rounded-xl border-2 ${colorClasses[color]}`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-xs font-semibold mb-1 text-center">{label}</p>
      <p className="text-lg font-bold text-center">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <span className="text-sm text-gray-900 font-semibold">{value}</span>
    </div>
  );
}

function ActionButton({ icon, label, onClick, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    purple: "bg-purple-50 text-purple-600 hover: bg-purple-100",
    gray: "bg-gray-100 text-gray-600 hover:bg-gray-200",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 p-3 rounded-lg transition font-medium text-sm ${colorClasses[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}