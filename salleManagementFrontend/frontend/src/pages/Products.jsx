import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CubeIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  StarIcon,
  ChartBarIcon,
  TagIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { uploadImage } from "../utils/uploadImage";
import { useNavigate } from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/Toast";
import { useDarkMode } from "../context/DarkModeContext";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService";
import { getCategories } from "../services/categoryService";

export default function Products() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { darkMode } = useDarkMode();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("none");
  const [stockFilter, setStockFilter] = useState("all"); // 'all', 'low', 'medium', 'high'
  const [viewMode, setViewMode] = useState("grid");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [preview, setPreview] = useState(null);
  const [loadingImg, setLoadingImg] = useState(false);

  const emptyForm = {
    asin: "",
    title: "",
    price: "",
    stock: "",
    categoryId: "",
    imageUrl: "",
    rating: 0,
    reviewCount: 0,
    rank: 0
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadProducts(), loadCategories()]);
    setLoading(false);
  };

  const loadProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch {
      showToast("Failed to load products", "error");
    }
  };

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch {
      showToast("Failed to load categories", "error");
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast("Please upload an image file", "error");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setLoadingImg(true);

    try {
      const url = await uploadImage(file);
      setForm({ ...form, imageUrl: url });
      showToast("Image uploaded successfully", "success");
    } catch (error) {
      showToast("Failed to upload image", "error");
    } finally {
      setLoadingImg(false);
    }
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setPreview(null);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setForm({
      asin: p.asin,
      title: p.title,
      price: p.price,
      stock: p.stock,
      categoryId: p.categoryId,
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      rank: p.rank || 0,
      imageUrl: p.imageUrl
    });

    setPreview(p.imageUrl);
    setEditingId(p.id);
    setShowModal(true);
  };

  const saveProduct = async () => {
    // Validation
    if (!form.title.trim()) {
      showToast("Product title is required", "error");
      return;
    }
    if (!form.categoryId) {
      showToast("Please select a category", "error");
      return;
    }
    if (!form.imageUrl) {
      showToast("Please upload an image", "error");
      return;
    }
    if (form.price <= 0) {
      showToast("Price must be greater than 0", "error");
      return;
    }

    const payload = {
      asin: form.asin,
      title: form.title,
      price: Number(form.price),
      stock: Number(form.stock),
      categoryId: Number(form.categoryId),
      imageUrl: form.imageUrl,
      rating: Number(form.rating || 0),
      reviewCount: Number(form.reviewCount || 0),
      rank: Number(form.rank || 0),
    };

    try {
      if (!editingId) {
        await createProduct(payload);
        showToast("Product created successfully!", "success");
      } else {
        await updateProduct(editingId, payload);
        showToast("Product updated successfully!", "success");
      }

      setShowModal(false);
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.message || "Error saving product", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(confirmDeleteId);
      showToast("Product deleted successfully", "success");
      setConfirmDeleteId(null);
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.message || "Cannot delete product", "error");
    }
  };

  // Calculate KPIs
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const avgPrice = totalProducts > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / totalProducts).toFixed(2) : 0;
  const lowStockCount = products.filter(p => p.stock < 10).length;

  // Filtering & Sorting
  const filtered = products
    .filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.asin?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) =>
      categoryFilter === "All" ? true : p.categoryName === categoryFilter
    )
    .filter((p) => {
      if (stockFilter === "low") return p.stock < 10;
      if (stockFilter === "medium") return p.stock >= 10 && p.stock < 50;
      if (stockFilter === "high") return p.stock >= 50;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "stock-asc") return a.stock - b.stock;
      if (sortBy === "stock-desc") return b.stock - a.stock;
      if (sortBy === "name-asc") return a.title.localeCompare(b.title);
      if (sortBy === "name-desc") return b.title.localeCompare(a.title);
      return 0;
    });

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-arches-50/20'}`}>
        <div className="relative">
          <div className="w-16 h-16 border-4 border-arches-200 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-arches-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className={`mt-4 ${darkMode ? 'text-warm-400' : 'text-warm-500'}`}>Loading products...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-warm-950' : 'bg-gradient-to-br from-warm-50 via-white to-arches-50/20'}`}>

      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-4xl font-bold mb-2 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-warm-900'}`}>
              <CubeIcon className="h-10 w-10 text-arches-500" />
              Products
            </h1>
            <p className={darkMode ? 'text-warm-400' : 'text-warm-600'}>Manage your product inventory</p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-arches-500 to-arches-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-arches-600 hover:to-arches-700 transform hover:scale-105 transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="font-semibold">Add Product</span>
          </button>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            icon={<CubeIcon className="h-6 w-6" />}
            darkMode={darkMode}
            title="Total Products"
            value={totalProducts}
            color="arches"
          />
          <KpiCard
            icon={<ChartBarIcon className="h-6 w-6" />}
            title="Total Value"
            value={`$${totalValue.toFixed(0)}`}
            color="teal"
            darkMode={darkMode}
          />
          <KpiCard
            icon={<TagIcon className="h-6 w-6" />}
            title="Avg Price"
            value={`$${avgPrice}`}
            color="hof"
            darkMode={darkMode}
          />
          <KpiCard
            icon={<XMarkIcon className="h-6 w-6" />}
            title="Low Stock"
            value={lowStockCount}
            color="coral"
            darkMode={darkMode}
            alert={lowStockCount > 0}
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
                placeholder="Search by name or ASIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 focus:ring-2 focus:ring-arches-500 focus:border-transparent outline-none transition ${darkMode
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

            {/* Filters */}
            <div className="flex flex-wrap gap-3">

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-arches-500 outline-none transition font-medium text-sm ${darkMode
                  ? 'bg-warm-800 border-warm-700 text-white'
                  : 'bg-white border-warm-200 text-warm-700'
                  }`}
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              {/* Stock Filter */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className={`px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-arches-500 outline-none transition font-medium text-sm ${darkMode
                  ? 'bg-warm-800 border-warm-700 text-white'
                  : 'bg-white border-warm-200 text-warm-700'
                  }`}
              >
                <option value="all">All Stock</option>
                <option value="low">Low (&lt; 10)</option>
                <option value="medium">Medium (10-50)</option>
                <option value="high">High (&gt; 50)</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-arches-500 outline-none transition font-medium text-sm ${darkMode
                  ? 'bg-warm-800 border-warm-700 text-white'
                  : 'bg-white border-warm-200 text-warm-700'
                  }`}
              >
                <option value="none">Sort by... </option>
                <option value="name-asc">Name: A → Z</option>
                <option value="name-desc">Name:  Z → A</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="stock-asc">Stock:  Low → High</option>
                <option value="stock-desc">Stock: High → Low</option>
              </select>

              {/* View Toggle */}
              <div className={`flex gap-2 rounded-xl p-1 ${darkMode ? 'bg-warm-800' : 'border-2 border-warm-200'}`}>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition ${viewMode === "grid"
                    ? "bg-arches-500 text-white"
                    : darkMode ? "text-warm-400 hover:bg-warm-700" : "text-warm-600 hover:bg-warm-100"
                    }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition ${viewMode === "list"
                    ? "bg-arches-500 text-white"
                    : darkMode ? "text-warm-400 hover:bg-warm-700" : "text-warm-600 hover:bg-warm-100"
                    }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(search || categoryFilter !== "All" || stockFilter !== "all") && (
            <div className={`flex flex-wrap gap-2 mt-4 pt-4 border-t ${darkMode ? 'border-warm-700' : 'border-warm-200'}`}>
              <span className={`text-sm font-medium ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>Active Filters:</span>
              {search && (
                <FilterTag label={`Search: "${search}"`} onRemove={() => setSearch("")} darkMode={darkMode} />
              )}
              {categoryFilter !== "All" && (
                <FilterTag label={`Category: ${categoryFilter}`} onRemove={() => setCategoryFilter("All")} darkMode={darkMode} />
              )}
              {stockFilter !== "all" && (
                <FilterTag label={`Stock: ${stockFilter}`} onRemove={() => setStockFilter("all")} darkMode={darkMode} />
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filtered.length}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalProducts}</span> products
          </p>
        </div>
      </div>

      {/* GRID/LIST VIEW */}
      {filtered.length === 0 ? (
        <EmptyState hasFilters={search || categoryFilter !== "All" || stockFilter !== "all"} onReset={() => {
          setSearch("");
          setCategoryFilter("All");
          setStockFilter("all");
        }} />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCardGrid
              key={p.id}
              product={p}
              onEdit={() => openEditModal(p)}
              onDelete={() => setConfirmDeleteId(p.id)}
              onClick={() => navigate(`/admin/products/${p.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <ProductCardList
              key={p.id}
              product={p}
              onEdit={() => openEditModal(p)}
              onDelete={() => setConfirmDeleteId(p.id)}
              onClick={() => navigate(`/admin/products/${p.id}`)}
            />
          ))}
        </div>
      )}

      {/* MODAL ADD/EDIT */}
      {showModal && (
        <ProductModal
          form={form}
          editingId={editingId}
          categories={categories}
          preview={preview}
          loadingImg={loadingImg}
          onChange={handleChange}
          onImageChange={handleImage}
          onSave={saveProduct}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* DELETE CONFIRM */}
      {confirmDeleteId && (
        <ConfirmModal
          title="Delete Product"
          message="This action is permanent.  Continue?"
          confirmLabel="Delete"
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

function KpiCard({ icon, title, value, color, alert, darkMode }) {
  const colorClasses = {
    coral: { icon: "from-coral-500 to-coral-600", text: "text-coral-500" },
    teal: { icon: "from-teal-500 to-teal-600", text: "text-teal-500" },
    arches: { icon: "from-arches-500 to-arches-600", text: "text-arches-500" },
    hof: { icon: "from-hof-400 to-hof-500", text: "text-hof-500" },
  };

  const colors = colorClasses[color] || colorClasses.arches;

  return (
    <div className={`rounded-2xl shadow-sm border p-5 transition-all hover:shadow-lg ${alert
      ? darkMode ? 'bg-coral-500/10 border-coral-600' : 'border-coral-300 bg-coral-50/50'
      : darkMode ? 'bg-warm-900 border-warm-800' : 'bg-white border-warm-100'
      }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.icon} text-white shadow-lg`}>
          {icon}
        </div>
        {alert && <span className="text-xs font-bold text-coral-500 animate-pulse">⚠</span>}
      </div>
      <p className={`text-sm mb-1 ${darkMode ? 'text-warm-400' : 'text-warm-600'}`}>{title}</p>
      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-warm-900'}`}>{value}</p>
    </div>
  );
}

function FilterTag({ label, onRemove, darkMode }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${darkMode ? 'bg-arches-500/20 text-arches-400' : 'bg-arches-100 text-arches-700'
      }`}>
      {label}
      <button onClick={onRemove} className={darkMode ? 'hover:text-arches-300' : 'hover:text-arches-900'}>
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  );
}

function ProductCardGrid({ product, onEdit, onDelete, onClick }) {
  return (
    <div className="group bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">

      {/* Image */}
      <div className="relative overflow-hidden bg-gray-100 h-56">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition-transform duration-300"
          onClick={onClick}
        />
        {product.stock < 10 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Low Stock
          </span>
        )}
        {product.rating > 0 && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
            <StarSolid className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold">{product.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition cursor-pointer" onClick={onClick}>
            {product.title}
          </h2>
          <p className="text-xs text-gray-500">{product.categoryName}</p>
          {product.asin && <p className="text-xs text-gray-400">ASIN: {product.asin}</p>}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-2xl font-bold text-blue-600">${product.price}</p>
          <p className={`text-sm font-semibold ${product.stock < 10 ? 'text-red-600' : 'text-gray-600'}`}>
            Stock: {product.stock}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCardList({ product, onEdit, onDelete, onClick }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer flex gap-5">
      <img
        src={product.imageUrl}
        alt={product.title}
        className="h-24 w-24 object-cover rounded-lg bg-gray-100 flex-shrink-0"
        onClick={onClick}
      />

      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold text-gray-900 mb-1 hover:text-blue-600 transition truncate" onClick={onClick}>
          {product.title}
        </h2>
        <p className="text-sm text-gray-600 mb-2">{product.categoryName}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-blue-600 text-lg">${product.price}</span>
          <span className={product.stock < 10 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            Stock: {product.stock}
          </span>
          {product.rating > 0 && (
            <div className="flex items-center gap-1">
              <StarSolid className="h-4 w-4 text-yellow-400" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
        >
          <PencilSquareIcon className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
      <CubeIcon className="h-16 w-16 text-gray-300 mb-4" />
      <p className="text-gray-500 text-lg mb-2">
        {hasFilters ? "No products found" : "No products yet"}
      </p>
      <p className="text-gray-400 text-sm mb-6">
        {hasFilters ? "Try adjusting your filters" : "Get started by adding your first product"}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

function ProductModal({ form, editingId, categories, preview, loadingImg, onChange, onImageChange, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <CubeIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Left Column */}
            <div className="space-y-4">
              <FormField label="Product Title *" required>
                <input
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  placeholder="e.g., Wireless Headphones"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </FormField>

              <FormField label="ASIN">
                <input
                  name="asin"
                  value={form.asin}
                  onChange={onChange}
                  placeholder="B08XYZ1234"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus: ring-blue-500 focus: border-transparent outline-none transition"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Price *" required>
                  <input
                    name="price"
                    value={form.price}
                    onChange={onChange}
                    type="number"
                    step="0.01"
                    placeholder="99.99"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus: ring-blue-500 focus: border-transparent outline-none transition"
                  />
                </FormField>

                <FormField label="Stock *" required>
                  <input
                    name="stock"
                    value={form.stock}
                    onChange={onChange}
                    type="number"
                    placeholder="100"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus: ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </FormField>
              </div>

              <FormField label="Category *" required>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={onChange}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus: ring-blue-500 focus: border-transparent outline-none transition bg-white"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <FormField label="Product Image *" required>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        <PhotoIcon className="h-5 w-5" />
                        Change Image
                        <input
                          type="file"
                          onChange={onImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">Click to upload image</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        onChange={onImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                  )}
                  {loadingImg && (
                    <div className="flex items-center justify-center gap-2 text-blue-600 mt-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Rating">
                  <input
                    name="rating"
                    value={form.rating}
                    onChange={onChange}
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="4.5"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus: ring-blue-500 focus: border-transparent outline-none transition"
                  />
                </FormField>

                <FormField label="Reviews">
                  <input
                    name="reviewCount"
                    value={form.reviewCount}
                    onChange={onChange}
                    type="number"
                    placeholder="250"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus: ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </FormField>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2. 5 rounded-lg bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loadingImg}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition transform hover:scale-105 disabled: opacity-50 disabled:cursor-not-allowed"
          >
            {editingId ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}