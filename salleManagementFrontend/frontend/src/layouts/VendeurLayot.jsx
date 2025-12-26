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
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
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
