import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  CubeIcon,
  TagIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarSquareIcon,
  PresentationChartLineIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

const mainLinks = [
  { name: "Dashboard", to: "/dashboard", icon: HomeIcon },
  { name: "Products", to: "/products", icon: CubeIcon },
  { name: "Categories", to: "/categories", icon: TagIcon },
  { name: "Users", to: "/users", icon: UsersIcon },
  { name: "Sales", to: "/sales", icon: BuildingOfficeIcon },
];

const analyticsLinks = [
  { name: "Overview", to: "/analytics", icon: ChartBarSquareIcon },
  { name: "Products Analytics", to: "/analytics/products", icon: PresentationChartLineIcon },
  { name: "Categories Analytics", to: "/analytics/categories", icon: ChartPieIcon },
  { name: "Sales Analytics", to: "/analytics/sales", icon: ArrowTrendingUpIcon },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-xl border-r border-gray-200 min-h-screen flex flex-col">
      
      {/* LOGO */}
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">SalleManager</h1>
      </div>

      <nav className="flex-1 px-4 space-y-8">

        {/* MAIN LINKS */}
        <div className="space-y-1">
          {mainLinks.map(({ name, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all 
                text-sm font-medium
                ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-gray-700 hover:bg-gray-100"
                }
                `
              }
            >
              <Icon className="h-5 w-5 text-gray-500" />
              {name}
            </NavLink>
          ))}
        </div>

        {/* ANALYTICS SECTION */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
            Analytics
          </p>

          <div className="space-y-1">
            {analyticsLinks.map(({ name, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `
                  flex items-center gap-3 px-4 py-2 rounded-lg text-sm
                  transition-all
                  ${
                    isActive
                      ? "bg-purple-50 text-purple-700 border border-purple-100"
                      : "text-gray-600 hover:bg-gray-100"
                  }
                  `
                }
              >
                <Icon className="h-5 w-5 text-gray-500" />
                {name}
              </NavLink>
            ))}
          </div>
        </div>

      </nav>
    </aside>
  );
}
