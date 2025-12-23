import { useState, useEffect } from "react";
import { getProducts } from "../services/productService";
import { createSale } from "../services/salesService";
import { useToast } from "./Toast";
import { useUser } from "../context/UserContext";
import {
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  UserIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function SaleFormModal({ onClose, onSave }) {
  const { showToast } = useToast();
  const { user } = useUser();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load products", "error");
    }
    setLoadingProducts(false);
  };

  // ➕ Ajouter produit au cart
  const addToCart = () => {
    if (!selectedProduct) {
      showToast("Please select a product first", "error");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);

    if (!product) return;

    if (quantity <= 0) {
      showToast("Quantity must be greater than 0", "error");
      return;
    }

    if (quantity > product.stock) {
      showToast(`Only ${product.stock} units available in stock`, "error");
      return;
    }

    // Empêcher doublon
    if (cart.some((l) => l.productId === selectedProduct)) {
      showToast("This product is already in the cart", "warning");
      return;
    }

    setCart([
      ...cart,
      {
        productId: product.id,
        productTitle: product. title,
        quantity,
        unitPrice: product.price,
        lineTotal: product.price * quantity,
        maxStock: product.stock,
        imageUrl: product.imageUrl,
      },
    ]);

    // Reset
    setSelectedProduct(null);
    setQuantity(1);
    setSearch("");
    showToast("Product added to cart", "success");
  };

  // ✏ Modifier quantité dans le tableau
  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeLine(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          if (newQty > item. maxStock) {
            showToast(`Only ${item.maxStock} units available`, "error");
            return item;
          }

          return {
            ...item,
            quantity: newQty,
            lineTotal: newQty * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  // 🗑 Supprimer ligne
  const removeLine = (productId) => {
    setCart(cart.filter((l) => l.productId !== productId));
    showToast("Product removed from cart", "info");
  };

  // Calculer totaux
  const subtotal = cart.reduce((sum, l) => sum + l.lineTotal, 0);
  const tax = subtotal * 0.2; // TVA 20%
  const total = subtotal + tax;
  const totalItems = cart.reduce((sum, l) => sum + l.quantity, 0);

  const handleCreateSale = async () => {
    if (!user || !user. id) {
      showToast("Please login again", "error");
      return;
    }

    if (cart.length === 0) {
      showToast("Please add at least one product", "error");
      return;
    }

    if (! clientName. trim()) {
      showToast("Please enter client name", "error");
      return;
    }

    const payload = {
      userId: user. id,
      clientName: clientName. trim(),
      lignes: cart.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      })),
    };

    try {
      setLoading(true);
      const response = await createSale(payload);
      
      // Save extra info for invoice
      localStorage.setItem(
        `sale-extra-${response.data.id}`,
        JSON.stringify({
          clientName: clientName.trim(),
          cart,
          total,
          date: new Date().toISOString(),
        })
      );

      showToast("Sale created successfully!", "success");
      onSave && onSave();
      onClose();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Error creating sale", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.asin?. toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <ShoppingCartIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">New Sale</h2>
              <p className="text-green-100 text-sm">Create a new sales transaction</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            
            {/* LEFT:  PRODUCT SELECTION */}
            <div className="space-y-4">
              
              {/* CLIENT NAME */}
              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-purple-600" />
                  Client Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter client name..."
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus: ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              {/* SEARCH */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
                  Search Products
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name or ASIN..."
                    className="w-full pl-10 pr-4 p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus: ring-green-500 focus:border-transparent outline-none transition"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* PRODUCT LIST */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <CubeIcon className="h-5 w-5 text-green-600" />
                  Available Products
                </label>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  {loadingProducts ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <CubeIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No products found</p>
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                      {filteredProducts. map((p) => (
                        <div
                          key={p.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer transition-all ${
                            selectedProduct === p.id
                              ? "bg-green-50 border-l-4 border-green-500"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedProduct(p.id)}
                        >
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-16 h-16 rounded-lg border-2 border-gray-200 object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {p.title}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              <span className="font-semibold text-green-600">
                                ${p.price}
                              </span>
                              <span className={p.stock < 10 ? "text-red-600 font-semibold" : ""}>
                                Stock: {p.stock}
                              </span>
                            </div>
                          </div>

                          {selectedProduct === p.id && (
                            <CheckIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                          )}

                          {p.stock < 10 && (
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* QUANTITY + ADD BUTTON */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 bg-gray-100 hover:bg-gray-200 transition"
                    >
                      <MinusIcon className="h-5 w-5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 p-3 text-center font-bold text-lg outline-none"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 bg-gray-100 hover:bg-gray-200 transition"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    &nbsp;
                  </label>
                  <button
                    onClick={addToCart}
                    disabled={!selectedProduct}
                    className="w-full h-[52px] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled: cursor-not-allowed shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: CART */}
            <div className="space-y-4">
              
              {/* CART HEADER */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
                    <h3 className="font-bold text-gray-900">Shopping Cart</h3>
                  </div>
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full font-bold text-sm">
                    {totalItems} items
                  </span>
                </div>
              </div>

              {/* CART ITEMS */}
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                {cart.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <ShoppingCartIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                    <p className="font-semibold mb-1">Cart is empty</p>
                    <p className="text-sm">Add products to create a sale</p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="text-left text-xs font-bold text-gray-600">
                          <th className="p-3">Product</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-right">Total</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {cart.map((item) => (
                          <tr key={item.productId} className="hover:bg-gray-50">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={item.imageUrl}
                                  alt={item.productTitle}
                                  className="w-10 h-10 rounded-lg border object-cover"
                                />
                                <span className="font-semibold text-sm text-gray-900 truncate max-w-[120px]">
                                  {item.productTitle}
                                </span>
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => updateQuantity(item.productId, item. quantity - 1)}
                                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center transition"
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={item.maxStock}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateQuantity(item.productId, parseInt(e.target.value) || 1)
                                  }
                                  className="w-12 text-center font-bold text-sm border border-gray-200 rounded p-1"
                                />
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center transition"
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </button>
                              </div>
                            </td>

                            <td className="p-3 text-right text-sm text-gray-700">
                              ${item.unitPrice. toFixed(2)}
                            </td>

                            <td className="p-3 text-right font-bold text-green-600">
                              ${item.lineTotal.toFixed(2)}
                            </td>

                            <td className="p-3">
                              <button
                                onClick={() => removeLine(item.productId)}
                                className="p-1 hover:bg-red-100 rounded transition"
                              >
                                <TrashIcon className="w-5 h-5 text-red-600" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* TOTALS */}
              {cart.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200 space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span>Tax (TVA 20%):</span>
                    <span className="font-semibold">${tax.toFixed(2)}</span>
                  </div>

                  <div className="pt-3 border-t-2 border-green-300 flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total:</span>
                    <span className="text-3xl font-bold text-green-600">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CurrencyDollarIcon className="h-5 w-5" />
            <span>Total Items: <span className="font-bold text-gray-900">{totalItems}</span></span>
            <span className="mx-2">•</span>
            <span>Total Amount: <span className="font-bold text-green-600">${total.toFixed(2)}</span></span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Cancel
            </button>

            <button
              onClick={handleCreateSale}
              disabled={cart.length === 0 || loading || !clientName. trim()}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled: cursor-not-allowed shadow-lg hover:shadow-xl transition font-semibold flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" />
                  Confirm Sale
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}