import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Search, Filter, ArrowUpRight, ArrowDownRight, Eye, Star,
  BarChart2, Zap, AlertTriangle, ChevronRight
} from "lucide-react";
import { getProducts } from "../../services/productService";
import { getSales } from "../../services/salesService";
import { getCategories } from "../../services/categoryService";

export default function InvestorProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("revenue");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, salesRes, categoriesRes] = await Promise.all([
        getProducts().catch(() => ({ data: [] })),
        getSales().catch(() => ({ data: [] })),
        getCategories().catch(() => ({ data: [] }))
      ]);

      const productsData = Array.isArray(productsRes?.data) ? productsRes.data : [];
      const salesData = Array.isArray(salesRes?.data) ? salesRes.data : [];
      const categoriesData = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];

      // Calculate product statistics
      const productStats = productsData.map(product => {
        const productSales = salesData.flatMap(sale => 
          (sale.lignes || []).filter(l => l.productId === product.id)
        );
        
        const totalQuantity = productSales.reduce((sum, l) => sum + (l.quantity || 0), 0);
        const totalRevenue = productSales.reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);
        const avgPrice = productSales.length > 0 
          ? productSales.reduce((sum, l) => sum + (l.unitPrice || 0), 0) / productSales.length 
          : product.price || 0;
        
        const category = categoriesData.find(c => c.id === product.categoryId);
        
        // Calculate trend (compare last 7 days vs previous 7 days)
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        const recentSales = salesData.filter(s => new Date(s.saleDate) >= weekAgo)
          .flatMap(s => (s.lignes || []).filter(l => l.productId === product.id))
          .reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);
        
        const previousSales = salesData.filter(s => {
          const d = new Date(s.saleDate);
          return d >= twoWeeksAgo && d < weekAgo;
        }).flatMap(s => (s.lignes || []).filter(l => l.productId === product.id))
          .reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);
        
        const trend = previousSales > 0 ? ((recentSales - previousSales) / previousSales * 100) : 0;
        
        // Performance score (0-100)
        const performanceScore = Math.min(100, Math.round(
          (totalQuantity * 2) + (totalRevenue / 100) + (trend > 0 ? 20 : 0)
        ));

        return {
          ...product,
          categoryName: category?.name || "Non catégorisé",
          totalQuantity,
          totalRevenue,
          avgPrice,
          trend: parseFloat(trend.toFixed(1)),
          performanceScore,
          salesCount: productSales.length,
          stockStatus: product.stock < 5 ? "critical" : product.stock < 15 ? "low" : "healthy"
        };
      });

      setProducts(productStats);
      setSales(salesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 p.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => filterCategory === "all" || p.categoryId?.toString() === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case "revenue": return b.totalRevenue - a.totalRevenue;
        case "quantity": return b.totalQuantity - a.totalQuantity;
        case "trend": return b.trend - a.trend;
        case "performance": return b.performanceScore - a.performanceScore;
        case "stock": return a.stock - b.stock;
        default: return 0;
      }
    });

  // Calculate summary stats
  const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalQuantitySold = products.reduce((sum, p) => sum + p.totalQuantity, 0);
  const avgPerformance = products.length > 0 
    ? products.reduce((sum, p) => sum + p.performanceScore, 0) / products.length 
    : 0;
  const lowStockCount = products.filter(p => p.stockStatus !== "healthy").length;

  const getStockBadge = (status) => {
    const styles = {
      critical: "bg-red-100 text-red-700 border-red-200",
      low: "bg-amber-100 text-amber-700 border-amber-200",
      healthy: "bg-teal-100 text-teal-700 border-teal-200"
    };
    const labels = { critical: "Stock Critique", low: "Stock Bas", healthy: "Stock OK" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getPerformanceColor = (score) => {
    if (score >= 70) return "text-teal-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-coral-500/30 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-warm-400 font-medium">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-coral-500" />
              Analyse des Produits
            </h1>
            <p className="text-warm-400 mt-1">
              Performance et rentabilité de votre catalogue
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="bg-warm-900/50 border border-warm-800 rounded-xl px-4 py-3">
              <p className="text-warm-400 text-xs">Revenus Totaux</p>
              <p className="text-xl font-bold text-teal-400">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-warm-900/50 border border-warm-800 rounded-xl px-4 py-3">
              <p className="text-warm-400 text-xs">Unités Vendues</p>
              <p className="text-xl font-bold text-coral-400">{totalQuantitySold.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-coral-500/20 to-coral-600/10 border border-coral-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-coral-500/20 rounded-xl">
                <Package className="w-5 h-5 text-coral-400" />
              </div>
              <span className="text-warm-400 text-sm">Total Produits</span>
            </div>
            <p className="text-3xl font-bold text-white">{products.length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-teal-500/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-teal-400" />
              </div>
              <span className="text-warm-400 text-sm">Performance Moy.</span>
            </div>
            <p className="text-3xl font-bold text-white">{avgPerformance.toFixed(0)}%</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-warm-400 text-sm">Stock Faible</span>
            </div>
            <p className="text-3xl font-bold text-white">{lowStockCount}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Star className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-warm-400 text-sm">Catégories</span>
            </div>
            <p className="text-3xl font-bold text-white">{categories.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-warm-900/50 border border-warm-800 rounded-2xl p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-warm-500" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-warm-800 border border-warm-700 rounded-xl text-white placeholder:text-warm-500 focus:ring-2 focus:ring-coral-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-warm-800 border border-warm-700 rounded-xl text-white focus:ring-2 focus:ring-coral-500"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 bg-warm-800 border border-warm-700 rounded-xl text-white focus:ring-2 focus:ring-coral-500"
            >
              <option value="revenue">Trier par Revenus</option>
              <option value="quantity">Trier par Quantité</option>
              <option value="trend">Trier par Tendance</option>
              <option value="performance">Trier par Performance</option>
              <option value="stock">Trier par Stock</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate(`/investisseur/products/${product.id}`)}
              className="bg-warm-900/50 border border-warm-800 rounded-2xl p-5 hover:border-coral-500/50 hover:shadow-lg hover:shadow-coral-500/10 transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-coral-400 transition-colors truncate">
                    {product.title}
                  </h3>
                  <p className="text-warm-500 text-sm">{product.categoryName}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-warm-600 group-hover:text-coral-400 transition-colors" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-warm-800/50 rounded-xl p-3">
                  <p className="text-warm-500 text-xs mb-1">Revenus</p>
                  <p className="text-lg font-bold text-teal-400">
                    ${product.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-warm-800/50 rounded-xl p-3">
                  <p className="text-warm-500 text-xs mb-1">Vendus</p>
                  <p className="text-lg font-bold text-white">
                    {product.totalQuantity}
                  </p>
                </div>
              </div>

              {/* Trend & Performance */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {product.trend >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-teal-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-coral-400" />
                  )}
                  <span className={product.trend >= 0 ? "text-teal-400" : "text-coral-400"}>
                    {product.trend > 0 ? "+" : ""}{product.trend}%
                  </span>
                  <span className="text-warm-500 text-sm">vs semaine passée</span>
                </div>
              </div>

              {/* Performance Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-warm-400">Performance</span>
                  <span className={getPerformanceColor(product.performanceScore)}>
                    {product.performanceScore}%
                  </span>
                </div>
                <div className="h-2 bg-warm-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      product.performanceScore >= 70 ? "bg-teal-500" :
                      product.performanceScore >= 40 ? "bg-amber-500" : "bg-coral-500"
                    }`}
                    style={{ width: `${product.performanceScore}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-warm-800">
                <div className="flex items-center gap-2">
                  <span className="text-warm-400 text-sm">Stock: {product.stock}</span>
                  {getStockBadge(product.stockStatus)}
                </div>
                <Eye className="w-4 h-4 text-warm-600 group-hover:text-coral-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-warm-700 mx-auto mb-4" />
            <p className="text-warm-400 text-lg">Aucun produit trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
