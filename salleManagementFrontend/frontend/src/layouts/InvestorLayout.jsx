import { Outlet, Navigate } from "react-router-dom";
import InvestorSidebar from "../components/investor/InvestorSidebar";
import InvestorNavbar from "../components/investor/InvestorNavbar";
import { useUser } from "../context/UserContext";
import { useDarkMode } from "../context/DarkModeContext";

export default function InvestorLayout() {
    const { user } = useUser();
    const { darkMode } = useDarkMode();

    // Mode développement - pas de vérification de rôle strict
    if (!user) {
        console.log("Investor Layout: No user found");
    }

    return (
        <div className={`h-screen flex transition-colors duration-300 ${darkMode
                ? 'bg-warm-950'
                : 'bg-gradient-to-br from-warm-50 via-white to-warm-50'
            }`}>
            <InvestorSidebar />

            <main className="flex-1 overflow-auto">
                <InvestorNavbar />
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
