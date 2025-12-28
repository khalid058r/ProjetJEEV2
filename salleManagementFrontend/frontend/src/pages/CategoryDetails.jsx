import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCategory,
  getCategoryProducts,
} from "../services/categoryService";

import {
  TagIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  CubeIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  SparklesIcon,
  XMarkIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../components/Toast";

export default function CategoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search + sort + view
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [priceFilter, setPriceFilter] = useState("all"); // 'all', 'low', 'mid', 'high'

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCategory(id);
      setCategory(res.data);

      const p = await getCategoryProducts(id);
      setProducts(p.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load category details", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Loading category details...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 text-lg">Category not found</p>
        <button
          onClick={() => navigate("/admin/categories")}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  /* -------------------------------------------
      KPI CALCULATIONS
  -------------------------------------------- */
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
  const avgPrice =
    totalProducts > 0
      ? (products.reduce((s, p) => s + (p.price || 0), 0) / totalProducts).toFixed(2)
      : 0;

  const bestSeller = products.reduce(
    (max, p) => (p.salesCount > (max?.salesCount || 0) ? p : max),
    null
  );

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock || 0), 0);

  /* -------------------------------------------
      FILTERED + SORTED PRODUCTS
  -------------------------------------------- */
  const filtered = products
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => {
      if (priceFilter === "low") return p.price < 50;
      if (priceFilter === "mid") return p.price >= 50 && p.price <= 200;
      if (priceFilter === "high") return p.price > 200;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "stock-asc") return a.stock - b.stock;
      if (sortBy === "stock-desc") return b.stock - a.stock;
      if (sortBy === "sales") return (b.salesCount || 0) - (a.salesCount || 0);
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 p-8">

      {/* -----------------------------------------
          HEADER WITH BREADCRUMB
      ------------------------------------------ */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin/categories")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Categories</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 px-8 py-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-20">
              <SparklesIcon className="h-40 w-40 text-white" />
            </div>

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <TagIcon className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{category.name}</h1>
                  <p className="text-purple-100 text-lg">
                    {category.description || "No description available"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate("/admin/products")}
                className="flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Add Product
              </button>
            </div>
          </div>

          {/* -----------------------------------------
              KPI CARDS INLINE
          ------------------------------------------ */}
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-gray-200">

            <KpiCard
              icon={<CubeIcon className="h-6 w-6" />}
              title="Products"
              value={totalProducts}
              color="blue"
            />

            <KpiCard
              icon={<ChartBarIcon className="h-6 w-6" />}
              title="Total Stock"
              value={totalStock.toLocaleString()}
              color="green"
            />

            <KpiCard
              icon={<CurrencyDollarIcon className="h-6 w-6" />}
              title="Avg Price"
              value={`$${avgPrice}`}
              color="purple"
            />

            <KpiCard
              icon={<CurrencyDollarIcon className="h-6 w-6" />}
              title="Total Value"
              value={`$${totalValue.toFixed(0)}`}
              color="orange"
            />

            <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 flex flex-col items-center justify-center">
              <TrophyIcon className="h-6 w-6 text-amber-600 mb-2" />
              <p className="text-xs text-gray-600 font-medium mb-1">Best Seller</p>
              <p className="text-sm font-bold text-gray-900 text-center line-clamp-2">
                {bestSeller ? bestSeller.title : "—"}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* -----------------------------------------
          FILTERS & CONTROLS
      ------------------------------------------ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

          {/* Search */}
          <div className="relative flex-1 w-full lg:max-w-md">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search products in this category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
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

          {/* Filters */}
          <div className="flex flex-wrap gap-3">

            {/* Price Filter */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="px-4 py-2. 5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition bg-white font-medium text-sm"
            >
              <option value="all">All Prices</option>
              <option value="low">Under $50</option>
              <option value="mid">$50 - $200</option>
              <option value="high">Over $200</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition bg-white font-medium text-sm"
            >
              <option value="name">Name (A-Z)</option>
              <option value="price-asc">Price:  Low → High</option>
              <option value="price-desc">Price:  High → Low</option>
              <option value="stock-asc">Stock: Low → High</option>
              <option value="stock-desc">Stock: High → Low</option>
              <option value="sales">Most Sold</option>
            </select>

            {/* View Toggle */}
            <div className="flex gap-2 border-2 border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition ${viewMode === "grid"
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition ${viewMode === "list"
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tags */}
        {(search || priceFilter !== "all") && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
            {search && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                Search: "{search}"
                <button onClick={() => setSearch("")} className="hover:text-purple-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {priceFilter !== "all" && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                Price: {priceFilter}
                <button onClick={() => setPriceFilter("all")} className="hover:text-blue-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filtered.length}</span> of{" "}
          <span className="font-semibold text-gray-900">{totalProducts}</span> products
        </p>
      </div>

      {/* -----------------------------------------
          PRODUCT LIST (GRID OR LIST VIEW)
      ------------------------------------------ */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          <CubeIcon className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-2">No products found</p>
          <p className="text-gray-400 text-sm">Try adjusting your filters</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCardGrid key={p.id} product={p} navigate={navigate} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <ProductCardList key={p.id} product={p} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}

/* -----------------------------------------
    KPI CARD COMPONENT
------------------------------------------ */
function KpiCard({ icon, title, value, color }) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    purple: "text-purple-600 bg-purple-50",
    orange: "text-orange-600 bg-orange-50",
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition">
      <div className={`p-2 rounded-lg mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-600 font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* -----------------------------------------
    PRODUCT CARD - GRID VIEW
------------------------------------------ */
function ProductCardGrid({ product, navigate }) {
  return (
    <div
      className="group bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      onClick={() => navigate(`/admin/products/${product.id}`)}
    >
      <div className="relative overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          className="h-48 w-full object-cover group-hover:scale-110 transition-transform duration-300"
          alt={product.title}
        />
        {product.stock < 10 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Low Stock
          </span>
        )}
      </div>

      <div className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition">
          {product.title}
        </h2>

        <div className="flex items-center justify-between mb-3">
          <p className="text-2xl font-bold text-purple-600">${product.price}</p>
          <p className="text-sm text-gray-500">Stock: {product.stock}</p>
        </div>

        {product.salesCount !== undefined && (
          <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <TrophyIcon className="h-4 w-4" />
            {product.salesCount} sales
          </div>
        )}
      </div>
    </div>
  );
}

/* -----------------------------------------
    PRODUCT CARD - LIST VIEW
------------------------------------------ */
function ProductCardList({ product, navigate }) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer flex gap-5"
      onClick={() => navigate(`/admin/products/${product.id}`)}
    >
      <img
        src={product.imageUrl}
        className="h-24 w-24 object-cover rounded-lg bg-gray-100 flex-shrink-0"
        alt={product.title}
      />

      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-900 mb-1 hover:text-purple-600 transition">
          {product.title}
        </h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="font-semibold text-purple-600 text-lg">${product.price}</span>
          <span>Stock: {product.stock}</span>
          {product.salesCount !== undefined && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <TrophyIcon className="h-4 w-4" />
              {product.salesCount} sales
            </span>
          )}
        </div>
      </div>
    </div>
  );
}