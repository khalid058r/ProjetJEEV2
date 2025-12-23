import { Outlet, Navigate } from "react-router-dom";
import VendeurSidebar from "../components/vendeur/VendeurSidebar";
import NavbarVendeur from "../components/vendeur/NavbarVendeur";
import { useUser } from "../context/UserContext";
export default function VendeurLayout() {
  const { user } = useUser();

  // Sécurité front minimale
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "VENDEUR") return <Navigate to="/unauthorized" replace />;

  return (
    <div className="h-screen flex bg-gray-50">
      <VendeurSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-6">
        <NavbarVendeur />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
