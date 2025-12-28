import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUser, createUser, updateUser } from "../services/userService";
import {
  UserCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../components/Toast";

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "VENDEUR",
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    setLoadingData(true);
    try {
      const res = await getUser(id);
      setForm({
        username: res.data.username,
        email: res.data.email,
        password: "",
        role: res.data.role,
      });
    } catch (err) {
      showToast("Failed to load user", "error");
      navigate("/admin/users");
    }
    setLoadingData(false);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.username.trim()) {
      showToast("Username is required", "error");
      return;
    }
    if (!form.email.trim()) {
      showToast("Email is required", "error");
      return;
    }
    if (!isEdit && !form.password) {
      showToast("Password is required for new users", "error");
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        await updateUser(id, form);
        showToast("User updated successfully!", "success");
      } else {
        await createUser(form);
        showToast("User created successfully!", "success");
      }
      navigate("/admin/users");
    } catch (err) {
      showToast(
        err.response?.data?.message || `Failed to ${isEdit ? "update" : "create"} user`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: "ADMIN", label: "Admin", icon: "👑", description: "Full system access", color: "from-red-500 to-pink-500" },
    { value: "VENDEUR", label: "Vendeur", icon: "🛒", description: "Sales management", color: "from-green-500 to-emerald-500" },
    { value: "ANALYSTE", label: "Analyste", icon: "📊", description: "Analytics access", color: "from-blue-500 to-cyan-500" },
    { value: "ACHETEUR", label: "Acheteur", icon: "🛍️", description: "Purchase orders", color: "from-purple-500 to-pink-500" },
    { value: "INVESTISSEUR", label: "Investisseur", icon: "💼", description: "Financial reports", color: "from-orange-500 to-red-500" },
  ];

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-500">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 p-8">

      {/* BREADCRUMB */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Users</span>
        </button>
      </div>

      {/* FORM CARD */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <UserCircleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {isEdit ? "Edit User" : "Create New User"}
                </h1>
                <p className="text-purple-100">
                  {isEdit ? `Updating user #${id}` : "Add a new user to the system"}
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-6">

              {/* Username */}
              <FormField label="Username" required>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </FormField>

              {/* Email */}
              <FormField label="Email Address" required>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </FormField>

              {/* Password */}
              <FormField
                label="Password"
                required={!isEdit}
                helper={isEdit ? "Leave blank to keep current password" : undefined}
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={isEdit ? "••••••••" : "Enter password"}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    required={!isEdit}
                  />
                </div>
              </FormField>

              {/* Role Selector */}
              <FormField label="Select Role" required>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map((role) => (
                    <label
                      key={role.value}
                      className={`relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${form.role === role.value
                          ? "border-purple-500 bg-purple-50 shadow-md scale-105"
                          : "border-gray-200 hover: border-purple-300 hover:bg-gray-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={form.role === role.value}
                        onChange={handleChange}
                        className="sr-only"
                      />

                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-3xl">{role.icon}</span>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{role.label}</p>
                          <p className="text-xs text-gray-600 mt-1">{role.description}</p>
                        </div>
                      </div>

                      {form.role === role.value && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-purple-600 rounded-full p-1">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </FormField>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-4 mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/admin/users")}
                className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover: from-purple-700 hover: to-pink-700 shadow-lg hover:shadow-xl transition transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEdit ? "Updating..." : "Creating..."}
                  </span>
                ) : (
                  <span>{isEdit ? "Update User" : "Create User"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------
    COMPONENTS
------------------------------------------ */

function FormField({ label, required, helper, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helper && (
        <p className="mt-1.5 text-xs text-gray-500">{helper}</p>
      )}
    </div>
  );
}