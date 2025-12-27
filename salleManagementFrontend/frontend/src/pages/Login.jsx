import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { useUser } from "../context/UserContext";
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useUser();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(form.email, form.password);

      // Vérification backend
      if (!user || !user.id || !user.role) {
        setError("Invalid response from server");
        setLoading(false);
        return;
      }

      // Sauvegarde dans UserContext + localStorage
      loginUser(user);

      // Redirection selon rôle
      switch (user.role) {
        case "ADMIN":
          navigate("/dashboard");
          break;

        case "VENDEUR":
          navigate("/vendeur");
          break;

        case "ANALYSTE":
          navigate("/analyste");
          break;

        case "ACHETEUR":
          navigate("/acheteur");
          break;

        case "INVESTISSEUR":
          navigate("/investisseur");
          break;

        default:
          navigate("/");
      }

    } catch (err) {
      console.log("LOGIN ERROR →", err);

      const msg =
        err?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Login failed";

      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-white to-coral-50/20 px-4 py-8">

      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-coral-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-hof-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-warm-100 overflow-hidden">

          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-coral-500 to-coral-600 px-8 py-10 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-coral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-coral-100">Sign in to continue to SaleManager</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-fadeIn">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-warm-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-warm-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent transition duration-200 outline-none"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-warm-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border border-warm-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent transition duration-200 outline-none"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-coral-500 border-warm-300 rounded focus:ring-coral-500" />
                  <span className="ml-2 text-warm-700">Remember me</span>
                </label>
                <button type="button" className="text-coral-500 hover:text-coral-600 font-medium">
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-coral-500 to-coral-600 text-white py-3 rounded-lg font-semibold hover:from-coral-600 hover:to-coral-700 transform hover:scale-[1.02] transition duration-200 shadow-lg shadow-coral-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRightIcon className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 mb-6 flex items-center">
              <div className="flex-1 border-t border-warm-300"></div>
              <span className="px-4 text-sm text-warm-500">or</span>
              <div className="flex-1 border-t border-warm-300"></div>
            </div>

            {/* Register Link */}
            <button
              onClick={() => navigate("/register")}
              className="w-full py-3 px-4 border-2 border-warm-300 text-warm-700 rounded-lg font-semibold hover:bg-warm-50 hover:border-teal-400 transition duration-200"
            >
              Create New Account
            </button>

          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-warm-600 mt-6">
          © 2024 SaleManager. All rights reserved.
        </p>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        . animate-blob {
          animation:  blob 7s infinite;
        }
        . animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}