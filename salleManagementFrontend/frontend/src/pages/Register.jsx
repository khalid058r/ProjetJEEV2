import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "VENDEUR",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerUser(form);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  const roles = [
    { value: "VENDEUR", label: "Vendeur", icon: "🛒" },
    { value: "ANALYSTE", label: "Analyste", icon: "📊" },
    { value: "ACHETEUR", label: "Acheteur", icon: "🛍️" },
    { value: "INVESTISSEUR", label: "Investisseur", icon: "💼" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-coral-50/30 via-white to-teal-50/30 px-4 py-6">

      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-coral-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative w-full max-w-lg">

        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="mb-3 flex items-center gap-2 text-warm-600 hover:text-warm-900 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm">Back to Login</span>
        </button>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-warm-100 overflow-hidden">

          {/* Header Compact */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
            <p className="text-teal-100 text-sm">Join SaleManager today</p>
          </div>

          {/* Form Compact */}
          <div className="px-6 py-6">

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-fadeIn">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-xs">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Two Column Layout for First Row */}
              <div className="grid grid-cols-2 gap-3">

                {/* Username */}
                <div>
                  <label className="block text-xs font-medium text-warm-700 mb-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-warm-400" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      placeholder="johndoe"
                      className="w-full pl-8 pr-2 py-2 text-sm border border-warm-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent transition outline-none"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-warm-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-4 w-4 text-warm-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="john@mail.com"
                      className="w-full pl-8 pr-2 py-2 text-sm border border-warm-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent transition outline-none"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Full Width */}
              <div>
                <label className="block text-xs font-medium text-warm-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-4 w-4 text-warm-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className="w-full pl-8 pr-2 py-2 text-sm border border-warm-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent transition outline-none"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Role Selector Compact */}
              <div>
                <label className="block text-xs font-medium text-warm-700 mb-2">Select Role</label>
                <div className="grid grid-cols-4 gap-2">
                  {roles.map((role) => (
                    <label
                      key={role.value}
                      className={`relative flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition ${form.role === role.value
                        ? 'border-coral-500 bg-coral-50 shadow-sm'
                        : 'border-warm-200 hover:border-coral-300'
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
                      <span className="text-2xl mb-1">{role.icon}</span>
                      <span className="text-xs font-medium text-warm-700 text-center leading-tight">{role.label}</span>
                      {form.role === role.value && (
                        <div className="absolute -top-1 -right-1 bg-coral-500 rounded-full p-0.5">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-coral-500 to-coral-600 text-white py-2.5 rounded-lg font-semibold hover:from-coral-600 hover:to-coral-700 transform hover:scale-[1.02] transition duration-200 shadow-lg shadow-coral-500/25 disabled:opacity-50 disabled: cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Account
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Login Link Compact */}
            <div className="mt-4 text-center">
              <p className="text-xs text-warm-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate("/")}
                  className="text-coral-500 hover:text-coral-600 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>

          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-warm-600 mt-4">
          © 2024 SaleManager. All rights reserved.
        </p>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform:  translate(0px, 0px) scale(1); }
        }
        . animate-blob {
          animation:  blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}