import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center p-4">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }} />
            </div>

            <div className="relative text-center max-w-2xl mx-auto">
                {/* 404 Number */}
                <div className="relative mb-8">
                    <h1 className="text-[12rem] md:text-[16rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 leading-none select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full shadow-2xl flex items-center justify-center">
                            <Search className="w-16 h-16 md:w-20 md:h-20 text-indigo-600" />
                        </div>
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Oops! Page Not Found
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back on track.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/dashboard"
                        className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <Home className="w-5 h-5" />
                        <span>Go to Dashboard</span>
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="group flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Go Back</span>
                    </button>
                </div>

                {/* Help Section */}
                <div className="mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <HelpCircle className="w-5 h-5 text-indigo-600" />
                        <span className="font-medium text-gray-900">Need Help?</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        If you believe this is an error, please contact our support team.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                            Dashboard
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/products" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                            Products
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/sales" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                            Sales
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/analytics" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                            Analytics
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
