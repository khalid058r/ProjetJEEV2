// import api from "./api";

// const AnalyticsService = {
//   // Existing endpoints
//   // getGlobalKpi: () => api.get("/analytics/kpi"),
//   getGlobalKpi: () => api.get("/analytics/kpi"),
//   getMonthlySales: () => api.get("/analytics/sales/monthly"),
//   getDailySales: (start, end) =>
//     api.get("/analytics/sales/daily", { params: { start, end } }),
//   getBestSellers: (limit = 5) =>
//     api.get("/analytics/products/best-sellers", { params: { limit } }),
//   getSlowMovers: () => api.get("/analytics/products/slow-movers"),
//   getLowStock: () => api.get("/analytics/products/low-stock"),
//   getCategoryStats: () => api.get("/analytics/categories"),
//   getCurrentMonthEvolution: () =>
//     api.get("/analytics/evolution/current-month"),
//   getBasketStats: () => api.get("/analytics/basket/stats"),
  
//   // New endpoints for enhanced analytics
//   getProductLifecycle: () => api.get("/analytics/products/lifecycle"),
//   getPriceHistogram: () => api.get("/analytics/products/price-histogram"),
//   getHourlySales: () => api.get("/analytics/sales/hourly"),
//   getCategoryGrowth: () => api.get("/analytics/categories/growth"),
//   getSalesForecast: (days = 30) => 
//     api.get("/analytics/sales/forecast", { params: { days } }),
//   getCustomerCohorts: () => api.get("/analytics/customers/cohorts"),
//   getSalesDistribution: () => api.get("/analytics/sales/distribution"),
//   getTopClients: (limit = 10) => 
//     api.get("/analytics/clients/top", { params: { limit } }),
//   getSalesByDay: () => api.get("/analytics/sales/by-day"),
//   getSalesByHour: () => api.get("/analytics/sales/by-hour"),
//   getConversionFunnel: () => api.get("/analytics/funnel/conversion"),
//   getCategoryTreemap: () => api.get("/analytics/categories/treemap"),
//   getProductBCG: () => api.get("/analytics/products/bcg-matrix"),

//   getVendeurKPI: () => api.get("/analytics/vendeur/kpi"),
//   getVendeurBestSellers: (limit = 5) =>
//     api.get("/analytics/vendeur/products/best-sellers", { params: { limit } }),
//   getVendeurDailySales: () =>
//     api.get("/analytics/vendeur/sales/daily"),

//   getVendeurKPI: () =>
//   api.get("/analytics/vendeur/kpi"),

// getVendeurBestSellers: (limit = 5) =>
//   api.get("/analytics/vendeur/products/best-sellers", {
//     params: { limit },
//   }),

// getVendeurDailySales: () =>
//   api.get("/analytics/vendeur/sales/daily"),

// };

// export default AnalyticsService;
import api from "./api";

const AnalyticsService = {
  // Existing endpoints
  getGlobalKpi: () => api.get("/analytics/kpi"),
  getMonthlySales: () => api.get("/analytics/sales/monthly"),
  getDailySales: (start, end) =>
    api.get("/analytics/sales/daily", { params: { start, end } }),
  getBestSellers: (limit = 5) =>
    api.get("/analytics/products/best-sellers", { params: { limit } }),
  getSlowMovers: () => api.get("/analytics/products/slow-movers"),
  getLowStock: () => api.get("/analytics/products/low-stock"),
  getCategoryStats: () => api.get("/analytics/categories"),
  getCurrentMonthEvolution: () =>
    api.get("/analytics/evolution/current-month"),
  getBasketStats: () => api.get("/analytics/basket/stats"),
  
  // New endpoints for enhanced analytics
  getProductLifecycle: () => api.get("/analytics/products/lifecycle"),
  getPriceHistogram: () => api.get("/analytics/products/price-histogram"),
  getHourlySales: () => api.get("/analytics/sales/hourly"),
  getCategoryGrowth: () => api.get("/analytics/categories/growth"),
  getSalesForecast: (days = 30) => 
    api.get("/analytics/sales/forecast", { params: { days } }),
  getCustomerCohorts: () => api.get("/analytics/customers/cohorts"),
  getSalesDistribution: () => api.get("/analytics/sales/distribution"),
  getTopClients: (limit = 10) => 
    api.get("/analytics/clients/top", { params: { limit } }),
  getSalesByDay: () => api.get("/analytics/sales/by-day"),
  getSalesByHour: () => api.get("/analytics/sales/by-hour"),
  getConversionFunnel: () => api.get("/analytics/funnel/conversion"),
  getCategoryTreemap: () => api.get("/analytics/categories/treemap"),
  getProductBCG: () => api.get("/analytics/products/bcg-matrix"),

  // ✅ Vendeur endpoints (garder UNE SEULE fois)
  getVendeurKPI: () => api.get("/analytics/vendeur/kpi"),
  getVendeurBestSellers: (limit = 5) =>
    api.get("/analytics/vendeur/products/best-sellers", { params: { limit } }),
  getVendeurDailySales: () => api.get("/analytics/vendeur/sales/daily"),
};

export default AnalyticsService;