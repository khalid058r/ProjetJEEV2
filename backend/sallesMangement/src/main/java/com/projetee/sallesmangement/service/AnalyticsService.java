package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.analytics.*;

import java.time.LocalDate;
import java.util.List;

public interface AnalyticsService {

    DashboardResponse getDashboard();
    KPIResponse getGlobalKPI();

    ProductFilterResponse filterProducts(ProductFilterRequest request);

    CategoryAnalysisResponse analyzeCategoryById(Long categoryId);

    // Exporter
    byte[] exportToCSV(ProductFilterRequest request);
    byte[] exportToPDF(ProductFilterRequest request); // Global report

    // Detailed Reports
    byte[] exportSalesPDF(ProductFilterRequest request);
    byte[] exportProductsPDF(ProductFilterRequest request);
    byte[] exportUsersPDF();
    byte[] exportInventoryPDF();
    byte[] exportSellersPDF(ProductFilterRequest request);

    GlobalStatisticsResponse getGlobalStatistics();

    MonthlySalesResponse getMonthlySales();
    List<DailySalesResponse> getDailySales(LocalDate startDate, LocalDate endDate);
    List<TopProductResponse> getBestSellers(int limit);
    List<SlowMoverResponse> getSlowMovers(long maxSoldThreshold, int limit);
    List<LowStockResponse> getLowStockProducts(int stockThreshold);
    List<CategoryStatsResponse> getCategoryStats();
    SalesEvolutionResponse getCurrentMonthEvolution();
    BasketStatsResponse getBasketStats();

    KPIResponse getVendeurKPI(Long userId);
    List<TopProductResponse> getVendeurBestSellers(Long userId, int limit);
    List<DailySalesResponse> getVendeurDailySales(Long userId);
}