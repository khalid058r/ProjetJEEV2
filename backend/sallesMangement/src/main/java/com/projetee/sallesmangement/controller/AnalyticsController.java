package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.analytics.*;
import com.projetee.sallesmangement.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
//@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/kpi")
    public KPIResponse getKPI() {
        return analyticsService.getGlobalKPI();
    }

    @GetMapping("/sales/monthly")
    public MonthlySalesResponse getMonthlySales() {
        return analyticsService.getMonthlySales();
    }

    @GetMapping("/sales/daily")
    public List<DailySalesResponse> getDailySales(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end
    ) {
        return analyticsService.getDailySales(start, end);
    }

    @GetMapping("/products/best-sellers")
    public List<TopProductResponse> getBestSellers(@RequestParam(defaultValue = "10") int limit) {
        return analyticsService.getBestSellers(limit);
    }

    @GetMapping("/products/slow-movers")
    public List<SlowMoverResponse> getSlowMovers(
            @RequestParam(defaultValue = "5") long maxSold,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return analyticsService.getSlowMovers(maxSold, limit);
    }

    @GetMapping("/products/low-stock")
    public List<LowStockResponse> getLowStockProducts(
            @RequestParam(defaultValue = "5") int threshold
    ) {
        return analyticsService.getLowStockProducts(threshold);
    }

    @GetMapping("/categories")
    public List<CategoryStatsResponse> getCategoryStats() {
        return analyticsService.getCategoryStats();
    }

    @GetMapping("/evolution/current-month")
    public SalesEvolutionResponse getCurrentMonthEvolution() {
        return analyticsService.getCurrentMonthEvolution();
    }

    @GetMapping("/basket/stats")
    public BasketStatsResponse getBasketStats() {
        return analyticsService.getBasketStats();
    }

    @GetMapping("/vendeur/kpi")
    public KPIResponse getVendeurKPI(
            @RequestHeader("X-User-Id") Long userId
    ) {
        return analyticsService.getVendeurKPI(userId);
    }

    @GetMapping("/vendeur/products/best-sellers")
    public List<TopProductResponse> getVendeurBestSellers(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return analyticsService.getVendeurBestSellers(userId, limit);
    }

    @GetMapping("/vendeur/sales/daily")
    public List<DailySalesResponse> getVendeurDailySales(
            @RequestHeader("X-User-Id") Long userId
    ) {
        return analyticsService.getVendeurDailySales(userId);
    }

}
