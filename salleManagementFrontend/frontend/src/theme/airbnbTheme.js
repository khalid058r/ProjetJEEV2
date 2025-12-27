/**
 * Airbnb-Inspired Theme Configuration
 * Clean, minimal design with coral accents and excellent dark mode support
 */

export const airbnbColors = {
  // Primary - Airbnb Coral/Red tones
  coral: {
    50: '#FEF3F2',
    100: '#FEE4E2',
    200: '#FECDC9',
    300: '#FDA4A7',
    400: '#F97575',
    500: '#FF5A5F', // Main Airbnb red/coral
    600: '#E04851',
    700: '#BC3943',
    800: '#9A343C',
    900: '#803239',
  },
  
  // Secondary - Teal/Mint for accents
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
  
  // Neutral - Warm grays for Airbnb feel
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#767676', // Airbnb gray
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0D0D0D',
  },
  
  // Rausch - Airbnb's primary brand red
  rausch: '#FF5A5F',
  
  // Babu - Airbnb's teal accent
  babu: '#00A699',
  
  // Arches - Airbnb's light accent
  arches: '#FC642D',
  
  // Hof - Airbnb's warm yellow
  hof: '#FFB400',
  
  // Kazan - Airbnb's purple accent
  kazan: '#914669',
  
  // Semantic colors
  success: '#00A699',
  warning: '#FFB400',
  error: '#FF5A5F',
  info: '#428BFF',
};

// Light mode theme
export const lightTheme = {
  mode: 'light',
  colors: {
    // Backgrounds
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F7F7F7',
    bgTertiary: '#EBEBEB',
    bgElevated: '#FFFFFF',
    bgHover: '#F7F7F7',
    bgActive: '#EBEBEB',
    
    // Text
    textPrimary: '#222222',
    textSecondary: '#717171',
    textMuted: '#B0B0B0',
    textInverse: '#FFFFFF',
    
    // Borders
    borderPrimary: '#DDDDDD',
    borderSecondary: '#EBEBEB',
    borderFocus: '#222222',
    
    // Brand
    primary: airbnbColors.coral[500],
    primaryHover: airbnbColors.coral[600],
    secondary: airbnbColors.teal[500],
    secondaryHover: airbnbColors.teal[600],
    
    // Accents
    accent: airbnbColors.arches,
    
    // Semantic
    success: '#00A699',
    successLight: '#E6F6F5',
    warning: '#FFB400',
    warningLight: '#FFF8E5',
    error: '#FF5A5F',
    errorLight: '#FEECEE',
    info: '#428BFF',
    infoLight: '#E8F0FF',
    
    // Cards
    cardBg: '#FFFFFF',
    cardBorder: '#EBEBEB',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    
    // Sidebar
    sidebarBg: '#FFFFFF',
    sidebarText: '#222222',
    sidebarTextMuted: '#717171',
    sidebarHover: '#F7F7F7',
    sidebarActive: airbnbColors.coral[50],
    sidebarActiveBorder: airbnbColors.coral[500],
    
    // Charts
    chart1: airbnbColors.coral[500],
    chart2: airbnbColors.teal[500],
    chart3: airbnbColors.arches,
    chart4: airbnbColors.hof,
    chart5: airbnbColors.kazan,
    chart6: '#428BFF',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 25px rgba(0, 0, 0, 0.06), 0 4px 10px rgba(0, 0, 0, 0.04)',
    xl: '0 20px 50px rgba(0, 0, 0, 0.08), 0 10px 20px rgba(0, 0, 0, 0.06)',
    card: '0 6px 20px rgba(0, 0, 0, 0.06)',
    button: '0 2px 6px rgba(0, 0, 0, 0.08)',
    buttonHover: '0 4px 12px rgba(0, 0, 0, 0.12)',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  }
};

// Dark mode theme
export const darkTheme = {
  mode: 'dark',
  colors: {
    // Backgrounds
    bgPrimary: '#0F0F0F',
    bgSecondary: '#1A1A1A',
    bgTertiary: '#262626',
    bgElevated: '#1A1A1A',
    bgHover: '#262626',
    bgActive: '#333333',
    
    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textMuted: '#6B6B6B',
    textInverse: '#0F0F0F',
    
    // Borders
    borderPrimary: '#333333',
    borderSecondary: '#262626',
    borderFocus: '#FFFFFF',
    
    // Brand (slightly brighter for dark mode)
    primary: '#FF7A7F',
    primaryHover: airbnbColors.coral[400],
    secondary: '#00D1C0',
    secondaryHover: airbnbColors.teal[400],
    
    // Accents
    accent: airbnbColors.arches,
    
    // Semantic
    success: '#00D1C0',
    successLight: 'rgba(0, 209, 192, 0.15)',
    warning: '#FFD166',
    warningLight: 'rgba(255, 209, 102, 0.15)',
    error: '#FF7A7F',
    errorLight: 'rgba(255, 122, 127, 0.15)',
    info: '#64A9FF',
    infoLight: 'rgba(100, 169, 255, 0.15)',
    
    // Cards
    cardBg: '#1A1A1A',
    cardBorder: '#333333',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
    
    // Sidebar
    sidebarBg: '#0F0F0F',
    sidebarText: '#FFFFFF',
    sidebarTextMuted: '#B3B3B3',
    sidebarHover: '#1A1A1A',
    sidebarActive: 'rgba(255, 122, 127, 0.15)',
    sidebarActiveBorder: '#FF7A7F',
    
    // Charts
    chart1: '#FF7A7F',
    chart2: '#00D1C0',
    chart3: '#FF9B4A',
    chart4: '#FFD166',
    chart5: '#B98EFF',
    chart6: '#64A9FF',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
    lg: '0 10px 25px rgba(0, 0, 0, 0.35), 0 4px 10px rgba(0, 0, 0, 0.25)',
    xl: '0 20px 50px rgba(0, 0, 0, 0.5), 0 10px 20px rgba(0, 0, 0, 0.35)',
    card: '0 6px 20px rgba(0, 0, 0, 0.4)',
    button: '0 2px 6px rgba(0, 0, 0, 0.25)',
    buttonHover: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  }
};

// Chart color palette
export const chartColors = {
  light: [
    airbnbColors.coral[500],
    airbnbColors.teal[500],
    airbnbColors.arches,
    airbnbColors.hof,
    airbnbColors.kazan,
    '#428BFF',
    '#7B61FF',
    '#00C49F',
  ],
  dark: [
    '#FF7A7F',
    '#00D1C0',
    '#FF9B4A',
    '#FFD166',
    '#B98EFF',
    '#64A9FF',
    '#A78BFF',
    '#00E5CC',
  ],
};

// Gradients
export const gradients = {
  primary: 'linear-gradient(135deg, #FF5A5F 0%, #FF8A8D 100%)',
  secondary: 'linear-gradient(135deg, #00A699 0%, #00D1C0 100%)',
  warm: 'linear-gradient(135deg, #FF5A5F 0%, #FC642D 100%)',
  sunset: 'linear-gradient(135deg, #FC642D 0%, #FFB400 100%)',
  purple: 'linear-gradient(135deg, #914669 0%, #B98EFF 100%)',
  ocean: 'linear-gradient(135deg, #00A699 0%, #428BFF 100%)',
  dark: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)',
};

export default {
  airbnbColors,
  lightTheme,
  darkTheme,
  chartColors,
  gradients,
};
