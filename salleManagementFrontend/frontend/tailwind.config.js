// Airbnb-Inspired Tailwind Configuration
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Airbnb Brand Colors
        coral: {
          50: '#FEF3F2',
          100: '#FEE4E2',
          200: '#FECDC9',
          300: '#FDA4A7',
          400: '#F97575',
          500: '#FF5A5F', // Main Airbnb coral
          600: '#E04851',
          700: '#BC3943',
          800: '#9A343C',
          900: '#803239',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#00A699', // Airbnb teal
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        // Warm neutrals
        warm: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#767676',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0D0D0D',
        },
        // Additional Airbnb accents with full scales
        arches: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FC642D', // Main arches orange
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        hof: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FFB400', // Main hof gold
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        kazan: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#914669', // Main kazan
          600: '#DB2777',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
        },
      },
      fontFamily: {
        sans: ['Circular', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'airbnb': '12px',
        'airbnb-lg': '16px',
        'airbnb-xl': '24px',
      },
      boxShadow: {
        'airbnb': '0 6px 20px rgba(0, 0, 0, 0.06)',
        'airbnb-md': '0 6px 16px rgba(0, 0, 0, 0.12)',
        'airbnb-lg': '0 6px 20px rgba(0, 0, 0, 0.2)',
        'airbnb-button': '0 2px 6px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark"],
    darkTheme: "dark",
  },
}