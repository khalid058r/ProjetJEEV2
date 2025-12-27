import { Outlet, Navigate } from "react-router-dom";
import VendeurSidebar from "../components/vendeur/VendeurSidebar";
import NavbarVendeur from "../components/vendeur/NavbarVendeur";
import { useUser } from "../context/UserContext";
import { useDarkMode } from "../context/DarkModeContext";

export default function VendeurLayout() {
  const { user } = useUser();
  const { darkMode } = useDarkMode();

  // Sécurité front minimale
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "VENDEUR") return <Navigate to="/unauthorized" replace />;

  return (
    <div className={`h-screen flex transition-colors duration-300 ${darkMode
        ? 'bg-warm-950'
        : 'bg-gradient-to-br from-warm-50 via-white to-warm-50'
      }`}>
      <VendeurSidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <NavbarVendeur />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
