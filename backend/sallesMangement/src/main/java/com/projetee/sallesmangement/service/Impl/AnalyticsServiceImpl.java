package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.analytics.*;
import com.projetee.sallesmangement.entity.*;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.mapper.AnalyticsMapper;
import com.projetee.sallesmangement.repository.*;
import com.projetee.sallesmangement.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
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
    private final AnalyticsMapper mapper;

    // ============ DASHBOARD ============

    @Override
    public DashboardResponse getDashboard() {
        // KPIs
        DashboardKPI kpi = new DashboardKPI();
        kpi.setTotalProducts(productRepo.count());
        kpi.setTotalCategories(productRepo.countDistinctCategories());
        kpi.setAveragePrice(productRepo.getAveragePriceGlobal());
        kpi.setAverageRating(productRepo.getAverageRatingGlobal());

        // Distribution catégories
        List<Object[]> distResults = productRepo.getCategoryDistribution();
        List<CategoryDistribution> distribution = distResults.stream()
                .map(row -> new CategoryDistribution(
                        (String) row[0],      // categoryName
                        (Long) row[1],        // productCount
                        (Double) row[2],      // averagePrice
                        (Double) row[3]       // averageRating
                ))
                .collect(Collectors.toList());

        // Top 10 produits
        List<Product> top10 = productRepo.findAllOrderByRankAsc();
        List<TopProductDTO> top10Dtos = top10.stream()
                .limit(10)
                .map(this::mapToTopProductDTO)
                .collect(Collectors.toList());

        return new DashboardResponse(kpi, distribution, top10Dtos);
    }

    // ============ FILTRES AVANCÉS ============

    @Override
    public ProductFilterResponse filterProducts(ProductFilterRequest request) {
        // Valeurs par défaut
        Long categoryId = request.getCategoryId();
        Double minPrice = request.getMinPrice() != null ? request.getMinPrice() : 0.0;
        Double maxPrice = request.getMaxPrice() != null ? request.getMaxPrice() : 999999.0;
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "rank";

        // Appel query
        List<Product> products = productRepo.filterProducts(categoryId, minPrice, maxPrice, sortBy);

        // Map to DTO
        List<TopProductDTO> productDtos = products.stream()
                .map(this::mapToTopProductDTO)
                .collect(Collectors.toList());

        // Metadata
        FilterMetadata metadata = new FilterMetadata(minPrice, maxPrice, sortBy, categoryId);

        return new ProductFilterResponse(productDtos, products.size(), metadata);
    }

    // ============ ANALYSE CATÉGORIE ============

    @Override
    public CategoryAnalysisResponse analyzeCategoryById(Long categoryId) {
        // Vérifie que catégorie existe
        Category category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        CategoryAnalysisResponse response = new CategoryAnalysisResponse();
        response.setCategoryId(categoryId);
        response.setCategoryName(category.getName());

        // Prix moyen
        Double avgPrice = productRepo.getAveragePriceByCategory(categoryId);
        response.setAveragePrice(avgPrice != null ? avgPrice : 0.0);

        // Meilleur produit noté
        List<Product> bestRated = productRepo.findBestRatedByCategory(categoryId);
        if (!bestRated.isEmpty()) {
            response.setBestRatedProduct(mapToTopProductDTO(bestRated.get(0)));
        }

        // Meilleur vendeur (rank le plus bas)
        List<Product> bestSeller = productRepo.findBestSellerByCategory(categoryId);
        if (!bestSeller.isEmpty()) {
            response.setBestSellerProduct(mapToTopProductDTO(bestSeller.get(0)));
        }

        // Distribution notes
        List<Object[]> ratingDist = productRepo.getRatingDistributionByCategory(categoryId);
        List<RatingDistribution> ratingDistribution = ratingDist.stream()
                .map(row -> new RatingDistribution((Double) row[0], (Long) row[1]))
                .collect(Collectors.toList());
        response.setRatingDistribution(ratingDistribution);

        return response;
    }

    // ============ EXPORT CSV ============

    @Override
    public byte[] exportToCSV(ProductFilterRequest filters) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(baos);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(
                     "ASIN", "Title", "Category", "Price", "Rating", "Reviews", "Rank", "Stock"))) {

            // Récupère les produits filtrés
            ProductFilterResponse filtered = filterProducts(filters);

            // Écrit chaque ligne
            for (TopProductDTO product : filtered.getProducts()) {
                printer.printRecord(
                        product.getAsin(),
                        product.getTitle(),
                        product.getCategoryName(),
                        product.getPrice(),
                        product.getRating(),
                        product.getReviewCount(),
                        product.getRank(),
                        product.getStock()
                );
            }

            printer.flush();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Erreur export CSV: " + e.getMessage(), e);
        }
    }

    // ============ STATISTIQUES GLOBALES ============

    @Override
    public GlobalStatisticsResponse getGlobalStatistics() {
        // Prix
        Object[] priceStats = productRepo.getPriceStatistics();
        PriceStatistics priceDto = new PriceStatistics(
                (Double) priceStats[0],  // min
                (Double) priceStats[1],  // max
                (Double) priceStats[2]   // average
        );

        // Rating
        Double avgRating = productRepo.getAverageRatingGlobal();
        Long totalWithRating = productRepo.countProductsWithRating();
        Long totalProducts = productRepo.count();
        RatingStatistics ratingDto = new RatingStatistics(
                avgRating != null ? avgRating : 0.0,
                totalWithRating,
                totalProducts
        );

        // Stock
        Long lowStock = productRepo.countLowStock(10);
        Long outOfStock = productRepo.countOutOfStock();
        StockStatistics stockDto = new StockStatistics(lowStock, outOfStock, 10);

        return new GlobalStatisticsResponse(priceDto, ratingDto, stockDto);
    }

    // ============ HELPER - MAP TO DTO ============

    private TopProductDTO mapToTopProductDTO(Product product) {
        return new TopProductDTO(
                product.getId(),
                product.getAsin(),
                product.getTitle(),
                product.getCategory().getName(),
                product.getPrice(),
                product.getRating(),
                product.getReviewCount(),
                product.getRank(),
                product.getStock(),
                product.getImageUrl()
        );
    }


    @Override
    public KPIResponse getGlobalKPI() {
        List<Sale> confirmedSales = saleRepo.findByStatus(SaleStatus.CONFIRMED);

        double totalRevenue = confirmedSales.stream()
                .mapToDouble(Sale::getTotalAmount)
                .sum();

        long salesCount = confirmedSales.size();

        YearMonth currentMonth = YearMonth.now();
        double currentMonthRevenue = confirmedSales.stream()
                .filter(s -> YearMonth.from(s.getSaleDate()).equals(currentMonth))
                .mapToDouble(Sale::getTotalAmount)
                .sum();

        double averageBasket = salesCount == 0 ? 0.0 : totalRevenue / salesCount;

        // Totals
        KPIResponse.Totals totals = new KPIResponse.Totals();
        totals.setProducts(productRepo.count());
        totals.setCategories(categoryRepo.count());
        totals.setUsers(userRepo.count());

        // Sales
        KPIResponse.Sales sales = new KPIResponse.Sales();
        sales.setSalesCount(salesCount);
        sales.setTotalRevenue(totalRevenue);
        sales.setCurrentMonthRevenue(currentMonthRevenue);
        sales.setAverageBasket(averageBasket);

        // Performance
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

    // ============ VENTES MENSUELLES ============

    @Override
    public MonthlySalesResponse getMonthlySales() {
        List<Sale> confirmedSales = saleRepo.findByStatus(SaleStatus.CONFIRMED);

        Map<YearMonth, Double> revenueByMonth = new HashMap<>();
        for (Sale sale : confirmedSales) {
            YearMonth ym = YearMonth.from(sale.getSaleDate());
            revenueByMonth.merge(ym, sale.getTotalAmount(), Double::sum);
        }

        List<MonthlySalesResponse.MonthRevenue> list = revenueByMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    MonthlySalesResponse.MonthRevenue dto = new MonthlySalesResponse.MonthRevenue();
                    dto.setMonth(entry.getKey().toString());
                    dto.setRevenue(entry.getValue());
                    return dto;
                })
                .collect(Collectors.toList());

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

    // ============ VENTES QUOTIDIENNES ============

    @Override
    public List<DailySalesResponse> getDailySales(LocalDate startDate, LocalDate endDate) {
        List<Sale> confirmedSales = saleRepo.findByStatusAndDateBetween(
                SaleStatus.CONFIRMED, startDate, endDate
        );

        Map<LocalDate, List<Sale>> byDate = confirmedSales.stream()
                .collect(Collectors.groupingBy(Sale::getSaleDate));

        return byDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    double revenue = entry.getValue().stream()
                            .mapToDouble(Sale::getTotalAmount)
                            .sum();
                    long count = entry.getValue().size();
                    return mapper.toDailySalesResponse(entry.getKey(), revenue, count);
                })
                .collect(Collectors.toList());
    }

    // ============ BEST SELLERS ============

    @Override
    public List<TopProductResponse> getBestSellers(int limit) {
        List<Sale> confirmedSales = saleRepo.findByStatus(SaleStatus.CONFIRMED);

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
                .collect(Collectors.toList());
    }

    // ============ SLOW MOVERS ============

    @Override
    public List<SlowMoverResponse> getSlowMovers(long maxSoldThreshold, int limit) {
        List<Sale> confirmedSales = saleRepo.findByStatus(SaleStatus.CONFIRMED);

        Map<Product, Long> quantityByProduct = new HashMap<>();
        for (Sale sale : confirmedSales) {
            for (LigneVente lv : sale.getLignesVente()) {
                quantityByProduct.merge(lv.getProduct(), (long) lv.getQuantity(), Long::sum);
            }
        }

        return quantityByProduct.entrySet().stream()
                .filter(e -> e.getValue() <= maxSoldThreshold)
                .sorted(Map.Entry.comparingByValue())
                .limit(limit)
                .map(e -> mapper.toSlowMoverResponse(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    // ============ LOW STOCK ============

    @Override
    public List<LowStockResponse> getLowStockProducts(int stockThreshold) {
        return productRepo.findAll().stream()
                .filter(p -> p.getStock() != null && p.getStock() <= stockThreshold)
                .map(mapper::toLowStockResponse)
                .collect(Collectors.toList());
    }

    // ============ CATEGORY STATS ============

    @Override
    public List<CategoryStatsResponse> getCategoryStats() {
        List<Sale> confirmedSales = saleRepo.findByStatus(SaleStatus.CONFIRMED);

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

            List<Product> productsInCategory = productsByCategory.getOrDefault(c, List.of());
            double avgPrice = productsInCategory.isEmpty() ? 0.0
                    : productsInCategory.stream().mapToDouble(Product::getPrice).average().orElse(0.0);

            // Best seller dans la catégorie
            Product bestSeller = null;
            Map<Product, Double> revenueByProduct = new HashMap<>();
            for (Sale sale : confirmedSales) {
                for (LigneVente lv : sale.getLignesVente()) {
                    if (lv.getProduct().getCategory().equals(c)) {
                        revenueByProduct.merge(lv.getProduct(), lv.getLineTotal(), Double::sum);
                    }
                }
            }

            if (!revenueByProduct.isEmpty()) {
                bestSeller = revenueByProduct.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse(null);
            }

            result.add(mapper.toCategoryStatsResponse(c, totalRevenue, totalSold, avgPrice, bestSeller));
        }

        return result;
    }

    // ============ ÉVOLUTION ============

    @Override
    public SalesEvolutionResponse getCurrentMonthEvolution() {
        List<Sale> confirmedSales = saleRepo.findByStatus(SaleStatus.CONFIRMED);

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

    // ============ BASKET STATS ============

    @Override
    public BasketStatsResponse getBasketStats() {
        List<Sale> confirmedSales = saleRepo.findByStatus(SaleStatus.CONFIRMED);

        int n = confirmedSales.size();
        if (n == 0) {
            return new BasketStatsResponse(0.0, 0.0, 0.0);
        }

        double[] amounts = confirmedSales.stream()
                .mapToDouble(Sale::getTotalAmount)
                .toArray();

        double mean = Arrays.stream(amounts).average().orElse(0.0);
        double variance = Arrays.stream(amounts)
                .map(x -> (x - mean) * (x - mean))
                .sum() / n;
        double stdDev = Math.sqrt(variance);

        return new BasketStatsResponse(mean, variance, stdDev);
    }

    // ============ VENDEUR KPI ============

    @Override
    public KPIResponse getVendeurKPI(Long userId) {
        List<Sale> sales = saleRepo.findByStatusAndUserId(SaleStatus.CONFIRMED, userId);

        double revenue = sales.stream().mapToDouble(Sale::getTotalAmount).sum();
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

    // ============ VENDEUR BEST SELLERS ============

    @Override
    public List<TopProductResponse> getVendeurBestSellers(Long userId, int limit) {
        List<Sale> sales = saleRepo.findByStatusAndUserId(SaleStatus.CONFIRMED, userId);

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
                .collect(Collectors.toList());
    }

    // ============ VENDEUR DAILY SALES ============

    @Override
    public List<DailySalesResponse> getVendeurDailySales(Long userId) {
        List<Sale> sales = saleRepo.findByStatusAndUserId(SaleStatus.CONFIRMED, userId);

        return sales.stream()
                .collect(Collectors.groupingBy(Sale::getSaleDate))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> mapper.toDailySalesResponse(
                        e.getKey(),
                        e.getValue().stream().mapToDouble(Sale::getTotalAmount).sum(),
                        e.getValue().size()
                ))
                .collect(Collectors.toList());
    }


}