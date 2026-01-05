package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.analytics.*;
import com.projetee.sallesmangement.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // ============ DASHBOARD ============

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(analyticsService.getDashboard());
    }

    @GetMapping("/kpi")
    public ResponseEntity<KPIResponse> getKPI() {
        return ResponseEntity.ok(analyticsService.getGlobalKPI());
    }

    // ============ FILTRES ============

    @PostMapping("/products/filter")
    public ResponseEntity<ProductFilterResponse> filterProducts(
            @Valid @RequestBody ProductFilterRequest request) {
        return ResponseEntity.ok(analyticsService.filterProducts(request));
    }

    // ============ CATÉGORIE ============

    @GetMapping("/category/{id}")
    public ResponseEntity<CategoryAnalysisResponse> analyzeCategory(
            @PathVariable Long id) {
        return ResponseEntity.ok(analyticsService.analyzeCategoryById(id));
    }

    // ============ EXPORT ============

    @PostMapping("/export/csv")
    public ResponseEntity<byte[]> exportCSV(
            @Valid @RequestBody ProductFilterRequest request) {
        byte[] data = analyticsService.exportToCSV(request);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=products_export.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(data);
    }

    @PostMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPDF(
            @Valid @RequestBody ProductFilterRequest request) {
        byte[] data = analyticsService.exportToPDF(request);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=products_report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    // ============ DETAILED REPORTS ============

    @PostMapping("/export/pdf/sales")
    public ResponseEntity<byte[]> exportSalesPDF(@RequestBody(required = false) ProductFilterRequest request) {
        if (request == null) request = new ProductFilterRequest();
        byte[] data = analyticsService.exportSalesPDF(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport_ventes.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @PostMapping("/export/pdf/products")
    public ResponseEntity<byte[]> exportProductsPDF(@RequestBody(required = false) ProductFilterRequest request) {
        if (request == null) request = new ProductFilterRequest();
        byte[] data = analyticsService.exportProductsPDF(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport_produits.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @GetMapping("/export/pdf/users")
    public ResponseEntity<byte[]> exportUsersPDF() {
        byte[] data = analyticsService.exportUsersPDF();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport_utilisateurs.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @GetMapping("/export/pdf/inventory")
    public ResponseEntity<byte[]> exportInventoryPDF() {
        byte[] data = analyticsService.exportInventoryPDF();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport_inventaire.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @PostMapping("/export/pdf/sellers")
    public ResponseEntity<byte[]> exportSellersPDF(@RequestBody(required = false) ProductFilterRequest request) {
        if (request == null) request = new ProductFilterRequest();
        byte[] data = analyticsService.exportSellersPDF(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport_vendeurs.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    // ============ STATISTIQUES ============

    @GetMapping("/statistics")
    public ResponseEntity<GlobalStatisticsResponse> getStatistics() {
        return ResponseEntity.ok(analyticsService.getGlobalStatistics());
    }

    // ============ VENTES ============

    @GetMapping("/sales/monthly")
    public ResponseEntity<MonthlySalesResponse> getMonthlySales() {
        return ResponseEntity.ok(analyticsService.getMonthlySales());
    }

    @GetMapping("/sales/daily")
    public ResponseEntity<List<DailySalesResponse>> getDailySales(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(analyticsService.getDailySales(start, end));
    }

    @GetMapping("/products/best-sellers")
    public ResponseEntity<List<TopProductResponse>> getBestSellers(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getBestSellers(limit));
    }

    @GetMapping("/products/slow-movers")
    public ResponseEntity<List<SlowMoverResponse>> getSlowMovers(
            @RequestParam(defaultValue = "5") long maxSold,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getSlowMovers(maxSold, limit));
    }

    @GetMapping("/products/low-stock")
    public ResponseEntity<List<LowStockResponse>> getLowStockProducts(
            @RequestParam(defaultValue = "5") int threshold) {
        return ResponseEntity.ok(analyticsService.getLowStockProducts(threshold));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryStatsResponse>> getCategoryStats() {
        return ResponseEntity.ok(analyticsService.getCategoryStats());
    }

    @GetMapping("/evolution/current-month")
    public ResponseEntity<SalesEvolutionResponse> getCurrentMonthEvolution() {
        return ResponseEntity.ok(analyticsService.getCurrentMonthEvolution());
    }

    @GetMapping("/basket/stats")
    public ResponseEntity<BasketStatsResponse> getBasketStats() {
        return ResponseEntity.ok(analyticsService.getBasketStats());
    }

    // ============ VENDEUR ============

    @GetMapping("/vendeur/kpi")
    public ResponseEntity<KPIResponse> getVendeurKPI(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(analyticsService.getVendeurKPI(userId));
    }

    @GetMapping("/vendeur/products/best-sellers")
    public ResponseEntity<List<TopProductResponse>> getVendeurBestSellers(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(analyticsService.getVendeurBestSellers(userId, limit));
    }

    @GetMapping("/vendeur/sales/daily")
    public ResponseEntity<List<DailySalesResponse>> getVendeurDailySales(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(analyticsService.getVendeurDailySales(userId));
    }
}