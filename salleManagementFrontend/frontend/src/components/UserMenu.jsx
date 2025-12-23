// import { useState } from "react";
// import {
//   UserCircleIcon,
//   ArrowRightOnRectangleIcon,
//   Cog6ToothIcon,
// } from "@heroicons/react/24/outline";

// export function UserMenu({ onLogout }) {
//   const [open, setOpen] = useState(false);

//   return (
//     <div className="relative">
//       <button
//         onClick={() => setOpen(!open)}
//         className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
//       >
//         <UserCircleIcon className="h-7 w-7 text-gray-700 dark:text-gray-300" />
//         <span className="text-sm font-medium dark:text-white">Admin</span>
//       </button>

//       {/* DROPDOWN */}
//       {open && (
//         <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-2 z-50 border dark:border-gray-700 animate-fadeIn">

//           <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
//             <UserCircleIcon className="h-5 w-5" />
//             Profile
//           </button>

//           <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
//             <Cog6ToothIcon className="h-5 w-5" />
//             Settings
//           </button>

//           <button
//             onClick={onLogout}
//             className="w-full flex items-center gap-2 p-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40"
//           >
//             <ArrowRightOnRectangleIcon className="h-5 w-5" />
//             Logout
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
import { useState } from "react";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";

export function UserMenu({ onLogout }) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`
          flex items-center gap-2 px-3 py-1 rounded-lg transition-colors duration-200
          ${theme.mode === 'dark'
            ? 'hover:bg-gray-700 text-gray-300'
            :  'hover:bg-gray-100 text-gray-700'
          }
        `}
      >
        <UserCircleIcon className="h-7 w-7" />
        <span className="text-sm font-medium">Admin</span>
      </button>

      {/* DROPDOWN */}
      {open && (
        <div 
          className={`
            absolute right-0 mt-2 w-48 shadow-lg rounded-xl p-2 z-50 border
            transition-colors duration-200
            ${theme.mode === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
            }
          `}
        >
          <button 
            className={`
              w-full flex items-center gap-2 p-2 rounded-lg transition-colors
              ${theme.mode === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                :  'hover:bg-gray-100 text-gray-700'
              }
            `}
          >
            <UserCircleIcon className="h-5 w-5" />
            Profile
          </button>

          <button 
            className={`
              w-full flex items-center gap-2 p-2 rounded-lg transition-colors
              ${theme.mode === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
              }
            `}
          >
            <Cog6ToothIcon className="h-5 w-5" />
            Settings
          </button>

          <button
            onClick={onLogout}
            className={`
              w-full flex items-center gap-2 p-2 rounded-lg
              text-red-600 transition-colors
              ${theme.mode === 'dark'
                ? 'hover: bg-red-900/40'
                : 'hover:bg-red-100'
              }
            `}
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}