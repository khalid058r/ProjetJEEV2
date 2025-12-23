import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../../context/ThemeContext";
import { UserMenu } from "./../UserMenu";


export default function NavbarVendeur() {
    const handleLogout = () => {
    // delete token later
    window.location.href = "/";
  };
  const { theme, toggleMode, setPrimary } = useTheme();

  return (
    <div className="flex justify-between items-center bg-white dark:bg-gray-900
                    p-4 border-b dark:border-gray-700">

      <input
        type="text"
        placeholder="Search..."
        className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md w-64"
      />

      {/* THEMES */}
      <div className="flex items-center gap-4">

        {/* Mode switch */}
        <button
          onClick={toggleMode}
          className="p-2 rounded-md bg-gray-200 dark:bg-gray-700"
        >
          {theme.mode === "light" ? (
            <MoonIcon className="h-5 w-5" />
          ) : (
            <SunIcon className="h-5 w-5 text-yellow-300" />
          )}
        </button>

        {/* Primary color selector */}
        <select
          className="p-2 rounded-md bg-gray-200 dark:bg-gray-700"
          value={theme.primary}
          onChange={(e) => setPrimary(e.target.value)}
        >
          <option value="blue">Blue</option>
          <option value="violet">Violet</option>
          <option value="emerald">Green</option>
          <option value="amber">Orange</option>
          <option value="rose">Pink</option>
        </select>
      </div>
       <UserMenu onLogout={handleLogout} />
    </div>
  );
}
