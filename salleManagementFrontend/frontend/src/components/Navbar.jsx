// import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
// import { useTheme } from "../context/ThemeContext";
// import { UserMenu } from "./UserMenu";


// export default function Navbar() {
//     const handleLogout = () => {
//     // delete token later
//     window.location.href = "/";
//   };
//   const { theme, toggleMode, setPrimary } = useTheme();

//   return (
//     <div className="flex justify-between items-center bg-white dark:bg-gray-900
//                     p-4 border-b dark:border-gray-700">

//       <input
//         type="text"
//         placeholder="Search..."
//         className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md w-64"
//       />

//       {/* THEMES */}
//       <div className="flex items-center gap-4">

//         {/* Mode switch */}
//         <button
//           onClick={toggleMode}
//           className="p-2 rounded-md bg-gray-200 dark:bg-gray-700"
//         >
//           {theme.mode === "light" ? (
//             <MoonIcon className="h-5 w-5" />
//           ) : (
//             <SunIcon className="h-5 w-5 text-yellow-300" />
//           )}
//         </button>

//         {/* Primary color selector */}
//         <select
//           className="p-2 rounded-md bg-gray-200 dark:bg-gray-700"
//           value={theme.primary}
//           onChange={(e) => setPrimary(e.target.value)}
//         >
//           <option value="blue">Blue</option>
//           <option value="violet">Violet</option>
//           <option value="emerald">Green</option>
//           <option value="amber">Orange</option>
//           <option value="rose">Pink</option>
//         </select>
//       </div>
//        <UserMenu onLogout={handleLogout} />
//     </div>
//   );
// }
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";
import { UserMenu } from "./UserMenu";

export default function Navbar() {
  const handleLogout = () => {
    window.location.href = "/";
  };
  
  const { theme, toggleMode, setPrimary } = useTheme();

  return (
    <div 
      className={`
        flex justify-between items-center p-4 border-b transition-colors duration-200
        ${theme.mode === 'dark' 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-white border-gray-200'
        }
      `}
    >
      {/* Recherche - pour l'instant juste le design */}
      <input
        type="text"
        placeholder="Search..."
        className={`
          p-2 rounded-md w-64 transition-colors duration-200
          ${theme.mode === 'dark'
            ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-700'
            : 'bg-gray-100 text-gray-900 placeholder-gray-500 border-gray-200'
          }
          border focus:outline-none focus:ring-2 focus:ring-blue-500
        `}
      />

      {/* THEMES */}
      <div className="flex items-center gap-4">
        {/* Mode switch - Design amélioré */}
        <button
          onClick={toggleMode}
          className={`
            p-2 rounded-md transition-all duration-200
            ${theme. mode === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-200 hover:bg-gray-300'
            }
          `}
          title={theme.mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme.mode === "light" ? (
            <MoonIcon className="h-5 w-5 text-gray-700" />
          ) : (
            <SunIcon className="h-5 w-5 text-yellow-300" />
          )}
        </button>

        {/* Primary color selector */}
        <select
          className={`
            p-2 rounded-md transition-colors duration-200
            ${theme.mode === 'dark'
              ? 'bg-gray-700 text-white border-gray-600'
              : 'bg-gray-200 text-gray-900 border-gray-300'
            }
            border focus:outline-none focus:ring-2 focus: ring-blue-500
          `}
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