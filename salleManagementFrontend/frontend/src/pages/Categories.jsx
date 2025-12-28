import { useEffect, useState } from "react";
import {
  PlusIcon,
  TagIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FolderIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import {
  getCategories,
  createCategory,
  deleteCategory,
} from "../services/categoryService";

import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";

export default function Categories() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ---------------------------------
  // LOAD CATEGORIES FROM BACKEND
  // ---------------------------------
  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error("ERROR LOADING CATEGORIES:", err);
      showToast("Failed to load categories", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // ---------------------------------
  // CREATE CATEGORY
  // ---------------------------------
  const addCategory = async () => {
    if (!form.name.trim()) {
      showToast("Category name is required", "error");
      return;
    }

    try {
      await createCategory(form);
      setShowModal(false);
      setForm({ name: "", description: "" });
      loadCategories();
      showToast("Category created successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to create category", "error");
    }
  };

  // ---------------------------------
  // DELETE CATEGORY
  // ---------------------------------
  const removeCategory = async (id) => {
    if (!window.confirm("Delete this category?  This action cannot be undone.")) return;

    try {
      await deleteCategory(id);
      loadCategories();
      showToast("Category deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete category", "error");
    }
  };

  // Filter categories by search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Category colors for visual variety
  const categoryColors = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500",
    "from-teal-500 to-blue-500",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-8">

      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <FolderIcon className="h-10 w-10 text-blue-600" />
              Categories
            </h1>
            <p className="text-gray-600">Manage your product categories</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="font-semibold">Add Category</span>
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-4">
          <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Total Categories</p>
            <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Showing</p>
            <p className="text-2xl font-bold text-gray-900">{filteredCategories.length}</p>
          </div>
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          <FolderIcon className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {searchTerm ? "No categories found" : "No categories yet"}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {searchTerm ? "Try a different search term" : "Get started by creating your first category"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <PlusIcon className="h-5 w-5" />
              Create Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((cat, index) => (
            <div
              key={cat.id}
              className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => navigate(`/admin/categories/${cat.id}`)}
            >
              {/* Gradient Header */}
              <div className={`h-24 bg-gradient-to-br ${categoryColors[index % categoryColors.length]} p-5 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 opacity-20">
                  <SparklesIcon className="h-20 w-20 text-white" />
                </div>
                <TagIcon className="h-10 w-10 text-white drop-shadow-lg" />
              </div>

              {/* Content */}
              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                  {cat.name}
                </h2>
                <p className="text-gray-600 text-sm line-clamp-2 min-h-[40px]">
                  {cat.description || "No description provided. "}
                </p>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/categories/${cat.id}`);
                    }}
                    className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition group-hover:scale-110"
                    title="Edit"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCategory(cat.id);
                    }}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition group-hover:scale-110"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform animate-slideUp">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TagIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Add New Category</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Electronics, Fashion, Books"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe what this category includes..."
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  rows={4}
                ></textarea>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-lg bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={addCategory}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition transform hover:scale-105"
              >
                Create Category
              </button>
            </div>

          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform:  translateY(20px);
          }
          to {
            opacity: 1;
            transform:  translateY(0);
          }
        }
        . animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}