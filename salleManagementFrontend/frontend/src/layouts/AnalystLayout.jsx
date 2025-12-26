import { Outlet, Navigate } from "react-router-dom";
import AnalystSidebar from "../components/analyst/AnalystSidebar";
import AnalystNavbar from "../components/analyst/AnalystNavbar";
import { useUser } from "../context/UserContext";

export default function AnalystLayout() {
    const { user } = useUser();

    // Mode développement - pas de vérification de rôle strict
    // Rediriger vers login seulement si pas d'utilisateur du tout
    if (!user) {
        // Pour le dev, créer un utilisateur mock si nécessaire
        console.log("Analyst Layout: No user found");
    }

    return (
        <div className="h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <AnalystSidebar />

            <main className="flex-1 overflow-auto">
                <AnalystNavbar />
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
