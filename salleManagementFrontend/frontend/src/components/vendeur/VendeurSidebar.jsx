import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-md text-sm ${
    isActive ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
  }`;

export default function VendeurSidebar() {
  return (
    <aside className="w-64 border-r bg-white h-full p-3">
      <div className="mb-4">
        <div className="text-lg font-bold">Vendeur</div>
        <div className="text-xs text-gray-500">Sales Management</div>
      </div>

      <nav className="space-y-1">
        <NavLink to="/vendeur" end className={linkClass}>
          Dashboard
        </NavLink>

        <NavLink to="/vendeur/categories" className={linkClass}>
          Catégories
        </NavLink>

        <NavLink to="/vendeur/products" className={linkClass}>
          Produits
        </NavLink>

        <NavLink to="/vendeur/sales" className={linkClass}>
          Mes ventes
        </NavLink>

        <NavLink to="/vendeur/analytics" className={linkClass}>
          Analytics
        </NavLink>
      </nav>
    </aside>
  );
}
