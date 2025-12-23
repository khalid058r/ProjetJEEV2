// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,jsx,ts,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
//   plugins: [require("daisyui")],
// }
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // ✅ AJOUT:  Activer le dark mode avec la classe
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
}