package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.analytics.*;
import com.projetee.sallesmangement.entity.*;
import com.projetee.sallesmangement.mapper.AnalyticsMapper;
import com.projetee.sallesmangement.repository.CategoryRepository;
import com.projetee.sallesmangement.repository.LigneVenteRepository;
import com.projetee.sallesmangement.repository.ProductRepository;
import com.projetee.sallesmangement.repository.SaleRepository;
import com.projetee.sallesmangement.repository.UserRepository;
import com.projetee.sallesmangement.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final UserRepository userRepo;
    private final SaleRepository saleRepo;
    private final LigneVenteRepository ligneRepo;
    private final AnalyticsMapper mapper;

    @Override
    public KPIResponse getGlobalKPI() {

        List<Sale> confirmedSales = saleRepo.findAll().stream()
                .filter(s -> s.getStatus() == SaleStatus.CONFIRMED)
                .toList();

        double totalRevenue = confirmedSales.stream()
                .mapToDouble(Sale::getTotalAmount)
                .sum();

        long salesCount = confirmedSales.size();

        YearMonth currentMonth = YearMonth.now();
        double currentMonthRevenue = confirmedSales.stream()
                .filter(s -> YearMonth.from(s.getSaleDate()).equals(currentMonth))
                .mapToDouble(Sale::getTotalAmount)
                .sum();

        // panier moyen = CA total / nombre de ventes
        double averageBasket = salesCount == 0 ? 0.0 : totalRevenue / salesCount;

        KPIResponse.Totals totals = new KPIResponse.Totals();
        totals.setProducts(productRepo.count());
        totals.setCategories(categoryRepo.count());
        totals.setUsers(userRepo.count());

        KPIResponse.Sales sales = new KPIResponse.Sales();
        sales.setSalesCount(salesCount);
        sales.setTotalRevenue(totalRevenue);
        sales.setCurrentMonthRevenue(currentMonthRevenue);
        sales.setAverageBasket(averageBasket);

        // performance : meilleure catégorie + meilleur produit (en CA)
        String bestCategoryName = null;
        String bestProductTitle = null;

        if (!confirmedSales.isEmpty()) {

            Map<Category, Double> revenueByCategory = new HashMap<>();
            Map<Product, Double> revenueByProduct = new HashMap<>();

            for (Sale s : confirmedSales) {
                for (LigneVente lv : s.getLignesVente()) {
                    double amount = lv.getLineTotal();
                    Product p = lv.getProduct();
                    Category c = p.getCategory();

                    revenueByProduct.merge(p, amount, Double::sum);
                    revenueByCategory.merge(c, amount, Double::sum);
                }
            }

            bestCategoryName = revenueByCategory.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(e -> e.getKey().getName())
                    .orElse(null);

            bestProductTitle = revenueByProduct.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(e -> e.getKey().getTitle())
                    .orElse(null);
        }

        KPIResponse.Performance performance = new KPIResponse.Performance();
        performance.setBestCategory(bestCategoryName);
        performance.setBestSellerProduct(bestProductTitle);

        KPIResponse response = new KPIResponse();
        response.setTotals(totals);
        response.setSales(sales);
        response.setPerformance(performance);

        return response;
    }

    @Override
    public MonthlySalesResponse getMonthlySales() {

        List<Sale> confirmedSales = saleRepo.findAll().stream()
                .filter(s -> s.getStatus() == SaleStatus.CONFIRMED)
                .toList();

        Map<YearMonth, Double> revenueByMonth = new HashMap<>();

        for (Sale sale : confirmedSales) {
            YearMonth ym = YearMonth.from(sale.getSaleDate());
            revenueByMonth.merge(ym, sale.getTotalAmount(), Double::sum);
        }

        List<MonthlySalesResponse.MonthRevenue> list = revenueByMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    MonthlySalesResponse.MonthRevenue dto = new MonthlySalesResponse.MonthRevenue();
                    dto.setMonth(entry.getKey().toString()); // ex : "2025-01"
                    dto.setRevenue(entry.getValue());
                    return dto;
                })
                .toList();

        Map<String, Double> map = revenueByMonth.entrySet().stream()
                .collect(Collectors.toMap(
                        e -> e.getKey().toString(),
                        Map.Entry::getValue
                ));

        MonthlySalesResponse response = new MonthlySalesResponse();
        response.setList(list);
        response.setMap(map);

        return response;
    }

    @Override
    public List<DailySalesResponse> getDailySales(LocalDate startDate, LocalDate endDate) {

        List<Sale> confirmedSales = saleRepo.findAll().stream()
                .filter(s -> s.getStatus() == SaleStatus.CONFIRMED)
                .filter(s -> !s.getSaleDate().isBefore(startDate) && !s.getSaleDate().isAfter(endDate))
                .toList();

        Map<LocalDate, List<Sale>> byDate = confirmedSales.stream()
                .collect(Collectors.groupingBy(Sale::getSaleDate));

        return byDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    List<Sale> sales = entry.getValue();

                    double revenue = sales.stream()
                            .mapToDouble(Sale::getTotalAmount)
                            .sum();

                    long count = sales.size();

                    return mapper.toDailySalesResponse(date, revenue, count);
                })
                .toList();
    }

    @Override
    public List<TopProductResponse> getBestSellers(int limit) {

        List<Sale> confirmedSales = saleRepo.findAll().stream()
                .filter(s -> s.getStatus() == SaleStatus.CONFIRMED)
                .toList();

        Map<Product, Long> quantityByProduct = new HashMap<>();
        Map<Product, Double> revenueByProduct = new HashMap<>();

        for (Sale sale : confirmedSales) {
            for (LigneVente lv : sale.getLignesVente()) {
                Product p = lv.getProduct();
                quantityByProduct.merge(p, (long) lv.getQuantity(), Long::sum);
                revenueByProduct.merge(p, lv.getLineTotal(), Double::sum);
            }
        }

        return quantityByProduct.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
                .limit(limit)
                .map(entry -> {
                    Product product = entry.getKey();
                    long qty = entry.getValue();
                    double rev = revenueByProduct.getOrDefault(product, 0.0);
                    return mapper.toTopProductResponse(product, qty, rev);
                })
                .toList();
    }

    @Override
    public List<SlowMoverResponse> getSlowMovers(long maxSoldThreshold, int limit) {

        List<Sale> confirmedSales = saleRepo.findAll().stream()
                .filter(s -> s.getStatus() == SaleStatus.CONFIRMED)
                .toList();

        Map<Product, Long> quantityByProduct = new HashMap<>();

        for (Sale sale : confirmedSales) {
            for (LigneVente lv : sale.getLignesVente()) {
                Product p = lv.getProduct();
                quantityByProduct.merge(p, (long) lv.getQuantity(), Long::sum);
            }
        }

        return quantityByProduct.entrySet().stream()
                .filter(e -> e.getValue() <= maxSoldThreshold)
                .sorted(Map.Entry.comparingByValue()) // du plus vendu peu vers plus
                .limit(limit)
                .map(e -> mapper.toSlowMoverResponse(e.getKey(), e.getValue()))
                .toList();
    }

    @Override
    public List<LowStockResponse> getLowStockProducts(int stockThreshold) {

        return productRepo.findAll().stream()
                .filter(p -> p.getStock() != null && p.getStock() <= stockThreshold)
                .map(mapper::toLowStockResponse)
                .toList();
    }

    @Override
    public List<CategoryStatsResponse> getCategoryStats() {

        List<Sale> confirmedSales = saleRepo.findAll().stream()
                .filter(s -> s.getStatus() == SaleStatus.CONFIRMED)
                .toList();

        Map<Category, Double> revenueByCategory = new HashMap<>();
        Map<Category, Long> quantityByCategory = new HashMap<>();
        Map<Category, List<Product>> productsByCategory = new HashMap<>();

        for (Sale sale : confirmedSales) {
            for (LigneVente lv : sale.getLignesVente()) {
                Product p = lv.getProduct();
                Category c = p.getCategory();

                revenueByCategory.merge(c, lv.getLineTotal(), Double::sum);
                quantityByCategory.merge(c, (long) lv.getQuantity(), Long::sum);

                productsByCategory.computeIfAbsent(c, k -> new ArrayList<>()).add(p);
            }
        }

        List<CategoryStatsResponse> result = new ArrayList<>();

        for (Category c : revenueByCategory.keySet()) {

            double totalRevenue = revenueByCategory.getOrDefault(c, 0.0);
            long totalSold = quantityByCategory.getOrDefault(c, 0L);

            // prix moyen de la catégorie (moyenne des prix catalogue)
            List<Product> productsInCategory = productsByCategory.getOrDefault(c, List.of());
            double avgPrice = productsInCategory.isEmpty()
                    ? 0.0
                    : productsInCategory.stream()
                    .mapToDouble(Product::getPrice)
                    .average()
                    .orElse(0.0);

            // best seller de la catégorie (en CA)
            Product bestSeller = null;
            double bestRevenue = 0.0;

            Map<Product, Double> revenueByProduct = new HashMap<>();
            for (Sale sale : confirmedSales) {
                for (LigneVente lv : sale.getLignesVente()) {
                    Product p = lv.getProduct();
                    if (p.getCategory().equals(c)) {
                        revenueByProduct.merge(p, lv.getLineTotal(), Double::sum);
                    }
                }
            }

            for (Map.Entry<Product, Double> entry : revenueByProduct.entrySet()) {
                if (entry.getValue() > bestRevenue) {
                    bestRevenue = entry.getValue();
                    bestSeller = entry.getKey();
                }
            }

            result.add(mapper.toCategoryStatsResponse(c, totalRevenue, totalSold, avgPrice, bestSeller));
        }

        return result;
    }

    @Override
    public SalesEvolutionResponse getCurrentMonthEvolution() {

        List<Sale> confirmedSales = saleRepo.findAll().stream()
                .filter(s -> s.getStatus() == SaleStatus.CONFIRMED)
                .toList();

        YearMonth current = YearMonth.now();
        YearMonth previous = current.minusMonths(1);

        double currentRev = confirmedSales.stream()
                .filter(s -> YearMonth.from(s.getSaleDate()).equals(current))
                .mapToDouble(Sale::getTotalAmount)
                .sum();

        double previousRev = confirmedSales.stream()
                .filter(s -> YearMonth.from(s.getSaleDate()).equals(previous))
                .mapToDouble(Sale::getTotalAmount)
                .sum();

        double growth = previousRev == 0 ? 0.0 : ((currentRev - previousRev) / previousRev) * 100.0;

        SalesEvolutionResponse dto = new SalesEvolutionResponse();
        dto.setCurrentMonthRevenue(currentRev);
        dto.setPreviousMonthRevenue(previousRev);
        dto.setGrowthRate(growth);

        return dto;
    }

    @Override
    public BasketStatsResponse getBasketStats() {

        List<Sale> confirmedSales = saleRepo.findAll().stream()
                .filter(s -> s.getStatus() == SaleStatus.CONFIRMED)
                .toList();

        int n = confirmedSales.size();
        if (n == 0) {
            BasketStatsResponse dto = new BasketStatsResponse();
            dto.setAverageBasket(0.0);
            dto.setVariance(0.0);
            dto.setStandardDeviation(0.0);
            return dto;
        }

        double[] amounts = confirmedSales.stream()
                .mapToDouble(Sale::getTotalAmount)
                .toArray();

        double mean = Arrays.stream(amounts).average().orElse(0.0);

        double variance = Arrays.stream(amounts)
                .map(x -> (x - mean) * (x - mean))
                .sum() / n;

        double stdDev = Math.sqrt(variance);

        BasketStatsResponse dto = new BasketStatsResponse();
        dto.setAverageBasket(mean);
        dto.setVariance(variance);
        dto.setStandardDeviation(stdDev);

        return dto;
    }

    @Override
    public KPIResponse getVendeurKPI(Long userId) {

        List<Sale> sales = saleRepo.findByUserId(userId).stream()
                .filter(s -> s.getStatus() == SaleStatus.CONFIRMED)
                .toList();

        double revenue = sales.stream()
                .mapToDouble(Sale::getTotalAmount)
                .sum();

        long count = sales.size();

        double avgBasket = count == 0 ? 0.0 : revenue / count;

        KPIResponse.Sales s = new KPIResponse.Sales();
        s.setSalesCount(count);
        s.setTotalRevenue(revenue);
        s.setAverageBasket(avgBasket);

        KPIResponse response = new KPIResponse();
        response.setSales(s);

        return response;
    }

    @Override
    public List<TopProductResponse> getVendeurBestSellers(Long userId, int limit) {

        List<Sale> sales = saleRepo.findByUserId(userId).stream()
                .filter(s -> s.getStatus() == SaleStatus.CONFIRMED)
                .toList();

        Map<Product, Long> qty = new HashMap<>();
        Map<Product, Double> revenue = new HashMap<>();

        for (Sale s : sales) {
            for (LigneVente lv : s.getLignesVente()) {
                qty.merge(lv.getProduct(), (long) lv.getQuantity(), Long::sum);
                revenue.merge(lv.getProduct(), lv.getLineTotal(), Double::sum);
            }
        }

        return qty.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(limit)
                .map(e -> mapper.toTopProductResponse(
                        e.getKey(),
                        e.getValue(),
                        revenue.getOrDefault(e.getKey(), 0.0)
                ))
                .toList();
    }

    @Override
    public List<DailySalesResponse> getVendeurDailySales(Long userId) {

        List<Sale> sales = saleRepo.findByUserId(userId).stream()
                .filter(s -> s.getStatus() == SaleStatus.CONFIRMED)
                .toList();

        return sales.stream()
                .collect(Collectors.groupingBy(Sale::getSaleDate))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> mapper.toDailySalesResponse(
                        e.getKey(),
                        e.getValue().stream().mapToDouble(Sale::getTotalAmount).sum(),
                        e.getValue().size()
                ))
                .toList();
    }




}
