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

// PDF & Charts
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.PiePlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;

import javax.imageio.ImageIO;
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
             OutputStreamWriter writer = new OutputStreamWriter(baos, java.nio.charset.StandardCharsets.UTF_8);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(
                     "ASIN", "Title", "Category", "Price", "Rating", "Reviews", "Rank", "Stock"))) {

            // Add Byte Order Mark (BOM) for Excel compatibility with UTF-8
            baos.write(0xEF);
            baos.write(0xBB);
            baos.write(0xBF);

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

    // ============ EXPORT PDF ============

    @Override
    public byte[] exportToPDF(ProductFilterRequest filters) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            // 1. Setup Document
            com.lowagie.text.Document document = new com.lowagie.text.Document(com.lowagie.text.PageSize.A4);
            com.lowagie.text.pdf.PdfWriter.getInstance(document, baos);
            document.open();

            // 2. Add Title and Header
            com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 18, java.awt.Color.BLUE);
            com.lowagie.text.Paragraph title = new com.lowagie.text.Paragraph("Rapport d'Analyse des Produits", titleFont);
            title.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            document.add(title);
            document.add(new com.lowagie.text.Paragraph(" ")); // Spacer

            com.lowagie.text.Font dateFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA, 10, java.awt.Color.GRAY);
            document.add(new com.lowagie.text.Paragraph("Généré le: " + java.time.LocalDateTime.now(), dateFont));
            document.add(new com.lowagie.text.Paragraph(" "));

            // 3. Fetch Data
            ProductFilterResponse filtered = filterProducts(filters);
            List<TopProductDTO> products = filtered.getProducts();

            // 4. Add KPI Section
            addKPISection(document, products);

            // 5. Add Charts
            addCharts(document, products);

            // 6. Add Data Table
            addDataTable(document, products);

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Erreur export PDF: " + e.getMessage(), e);
        }
    }

    // ============ DETAILED REPORTS IMPLEMENTATION ============

    @Override
    public byte[] exportSalesPDF(ProductFilterRequest request) {
        return generateReport("Rapport des Ventes", document -> {
            List<Sale> sales = saleRepo.findAll(); // Should filter by date in real app
            
            // 1. KPI
            double totalRevenue = sales.stream().mapToDouble(Sale::getTotalAmount).sum();
            addKPIGrid(document, 
                "Total Ventes", String.valueOf(sales.size()),
                "Chiffre d'Affaires", String.format("%.2f €", totalRevenue),
                "Panier Moyen", String.format("%.2f €", sales.size() > 0 ? totalRevenue / sales.size() : 0)
            );

            // 2. Chart (Sales per day)
            DefaultCategoryDataset dataset = new DefaultCategoryDataset();
            sales.stream()
                .collect(Collectors.groupingBy(s -> s.getSaleDate().toString(), Collectors.summingDouble(Sale::getTotalAmount)))
                .forEach((date, amount) -> dataset.addValue(amount, "Ventes", date));
            
            addBarChart(document, "Évolution des Ventes", dataset);

            // 3. Table
            String[] headers = {"ID", "Date", "Client", "Montant", "Statut"};
            List<String[]> rows = sales.stream()
                .sorted((a, b) -> b.getSaleDate().compareTo(a.getSaleDate()))
                .limit(50)
                .map(s -> new String[]{
                    String.valueOf(s.getId()),
                    s.getSaleDate().toString(),
                    s.getUser().getUsername(),
                    String.format("%.2f €", s.getTotalAmount()),
                    s.getStatus().toString()
                }).collect(Collectors.toList());
            
            addReportTable(document, headers, rows);
        });
    }

    @Override
    public byte[] exportProductsPDF(ProductFilterRequest request) {
        return generateReport("Rapport des Produits", document -> {
            List<Product> products = productRepo.findAll();
            
            // 1. KPI
            addKPIGrid(document, 
                "Total Produits", String.valueOf(products.size()),
                "Stock Faible", String.valueOf(products.stream().filter(p -> p.getStock() <= 10).count()),
                "Prix Moyen", String.format("%.2f €", products.stream().mapToDouble(Product::getPrice).average().orElse(0))
            );

            // 2. Chart (Top 10 Stocks)
            DefaultCategoryDataset dataset = new DefaultCategoryDataset();
            products.stream()
                .sorted((a, b) -> b.getStock().compareTo(a.getStock()))
                .limit(10)
                .forEach(p -> dataset.addValue(p.getStock(), "Stock", p.getTitle().substring(0, Math.min(10, p.getTitle().length()))));
            
            addBarChart(document, "Top 10 Stocks", dataset);

            // 3. Table
            String[] headers = {"Produit", "Catégorie", "Prix", "Stock", "Rang"};
            List<String[]> rows = products.stream()
                .limit(50)
                .map(p -> new String[]{
                    p.getTitle(),
                    p.getCategory().getName(),
                    String.format("%.2f €", p.getPrice()),
                    String.valueOf(p.getStock()),
                    String.valueOf(p.getRank())
                }).collect(Collectors.toList());
            
            addReportTable(document, headers, rows);
        });
    }

    @Override
    public byte[] exportUsersPDF() {
        return generateReport("Rapport des Utilisateurs", document -> {
            List<User> users = userRepo.findAll();
            
            // 1. KPI
            addKPIGrid(document, 
                "Total Utilisateurs", String.valueOf(users.size()),
                "Actifs", String.valueOf(users.stream().filter(User::isActive).count()),
                "Vendeurs", String.valueOf(users.stream().filter(u -> u.getRole() == Role.VENDEUR).count())
            );

            // 2. Chart (Roles distribution)
            DefaultPieDataset dataset = new DefaultPieDataset();
            users.stream()
                .collect(Collectors.groupingBy(User::getRole, Collectors.counting()))
                .forEach((role, count) -> dataset.setValue(role.toString(), count));
            
            addPieChart(document, "Répartition par Rôle", dataset);

            // 3. Table
            String[] headers = {"ID", "Nom", "Email", "Rôle", "Actif"};
            List<String[]> rows = users.stream()
                .map(u -> new String[]{
                    String.valueOf(u.getId()),
                    u.getUsername(),
                    u.getEmail(),
                    u.getRole().toString(),
                    u.isActive() ? "Oui" : "Non"
                }).collect(Collectors.toList());
            
            addReportTable(document, headers, rows);
        });
    }

    @Override
    public byte[] exportInventoryPDF() {
        return generateReport("Rapport d'Inventaire", document -> {
            List<Product> products = productRepo.findAll();
            
            // 1. KPI
            double totalValue = products.stream().mapToDouble(p -> p.getPrice() * p.getStock()).sum();
            addKPIGrid(document, 
                "Valeur Totale", String.format("%.2f €", totalValue),
                "Total Unités", String.valueOf(products.stream().mapToInt(Product::getStock).sum()),
                "Out of Stock", String.valueOf(products.stream().filter(p -> p.getStock() == 0).count())
            );

            // 2. Chart (Stock Value by Category)
            DefaultPieDataset dataset = new DefaultPieDataset();
            products.stream()
                .collect(Collectors.groupingBy(p -> p.getCategory().getName(), Collectors.summingDouble(p -> p.getPrice() * p.getStock())))
                .forEach(dataset::setValue);
            
            addPieChart(document, "Valeur Stock par Catégorie", dataset);

            // 3. Table
            String[] headers = {"Produit", "Stock", "Prix Unitaire", "Valeur Totale"};
            List<String[]> rows = products.stream()
                .sorted((a, b) -> Double.compare(b.getStock() * (double)b.getPrice(), a.getStock() * (double)a.getPrice())) // Sort by value desc
                .limit(50)
                .map(p -> new String[]{
                    p.getTitle(),
                    String.valueOf(p.getStock()),
                    String.format("%.2f €", p.getPrice()),
                    String.format("%.2f €", p.getPrice() * p.getStock())
                }).collect(Collectors.toList());
            
            addReportTable(document, headers, rows);
        });
    }

    @Override
    public byte[] exportSellersPDF(ProductFilterRequest request) {
        return generateReport("Performance Vendeurs", document -> {
            List<User> sellers = userRepo.findByRole(Role.VENDEUR);
            List<Sale> allSales = saleRepo.findAll();

            // 1. KPI
            double totalRevenue = allSales.stream().mapToDouble(Sale::getTotalAmount).sum();
            addKPIGrid(document, 
                "Total Vendeurs", String.valueOf(sellers.size()),
                "CA Global", String.format("%.2f €", totalRevenue),
                "Moyenne/Vendeur", String.format("%.2f €", sellers.size() > 0 ? totalRevenue / sellers.size() : 0)
            );

            // 2. Chart (Revenue by Seller)
            DefaultCategoryDataset dataset = new DefaultCategoryDataset();
            for(User seller : sellers) {
                double revenue = allSales.stream()
                    .filter(s -> s.getUser().getId().equals(seller.getId()))
                    .mapToDouble(Sale::getTotalAmount).sum();
                dataset.addValue(revenue, "Chiffre d'Affaires", seller.getUsername());
            }
            
            addBarChart(document, "Chiffre d'Affaires par Vendeur", dataset);

            // 3. Table
            String[] headers = {"Vendeur", "Ventes", "Chiffre d'Affaires", "Panier Moyen"};
            List<String[]> rows = sellers.stream()
                .map(seller -> {
                    List<Sale> sellerSales = allSales.stream().filter(s -> s.getUser().getId().equals(seller.getId())).toList();
                    double rev = sellerSales.stream().mapToDouble(Sale::getTotalAmount).sum();
                    return new String[]{
                        seller.getUsername(),
                        String.valueOf(sellerSales.size()),
                        String.format("%.2f €", rev),
                        String.format("%.2f €", sellerSales.size() > 0 ? rev / sellerSales.size() : 0)
                    };
                })
                .sorted((a, b) -> Double.compare(
                    Double.parseDouble(b[2].replace(" €", "").replace(",", ".")), 
                    Double.parseDouble(a[2].replace(" €", "").replace(",", "."))
                ))
                .collect(Collectors.toList());
            
            addReportTable(document, headers, rows);
        });
    }

    // ============ PDF HELPERS ============

    @FunctionalInterface
    interface ReportContentGenerator {
        void generate(com.lowagie.text.Document document) throws Exception;
    }

    private byte[] generateReport(String title, ReportContentGenerator contentGenerator) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            com.lowagie.text.Document document = new com.lowagie.text.Document(com.lowagie.text.PageSize.A4);
            com.lowagie.text.pdf.PdfWriter.getInstance(document, baos);
            document.open();

            // Header
            com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 22, new java.awt.Color(0, 102, 204));
            com.lowagie.text.Paragraph titlePara = new com.lowagie.text.Paragraph(title, titleFont);
            titlePara.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            titlePara.setSpacingAfter(10);
            document.add(titlePara);
            
            com.lowagie.text.Font dateFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA, 10, java.awt.Color.GRAY);
            com.lowagie.text.Paragraph datePara = new com.lowagie.text.Paragraph("Généré le: " + java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), dateFont);
            datePara.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            datePara.setSpacingAfter(20);
            document.add(datePara);

            // Content
            contentGenerator.generate(document);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF: " + e.getMessage(), e);
        }
    }

    private void addKPIGrid(com.lowagie.text.Document document, String... kpiPairs) throws com.lowagie.text.DocumentException {
        if (kpiPairs.length % 2 != 0) return;
        
        com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(kpiPairs.length / 2);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10f);
        table.setSpacingAfter(20f);

        for (int i = 0; i < kpiPairs.length; i += 2) {
            addKPICell(table, kpiPairs[i], kpiPairs[i+1]);
        }
        document.add(table);
    }

    private void addBarChart(com.lowagie.text.Document document, String title, DefaultCategoryDataset dataset) throws Exception {
        JFreeChart chart = ChartFactory.createBarChart(
                title, "", "", dataset, PlotOrientation.VERTICAL, false, true, false);
        chart.setBackgroundPaint(java.awt.Color.white);
        chart.getCategoryPlot().setBackgroundPaint(java.awt.Color.white);
        
        java.awt.image.BufferedImage bufferedImage = chart.createBufferedImage(500, 250);
        com.lowagie.text.Image image = com.lowagie.text.Image.getInstance(writerImageToByteArray(bufferedImage));
        image.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        image.setSpacingAfter(20f);
        document.add(image);
    }

    private void addPieChart(com.lowagie.text.Document document, String title, DefaultPieDataset dataset) throws Exception {
        JFreeChart chart = ChartFactory.createPieChart(title, dataset, true, true, false);
        chart.setBackgroundPaint(java.awt.Color.white);
        chart.getPlot().setBackgroundPaint(java.awt.Color.white);
        
        java.awt.image.BufferedImage bufferedImage = chart.createBufferedImage(500, 250);
        com.lowagie.text.Image image = com.lowagie.text.Image.getInstance(writerImageToByteArray(bufferedImage));
        image.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        image.setSpacingAfter(20f);
        document.add(image);
    }

    private void addReportTable(com.lowagie.text.Document document, String[] headers, List<String[]> rows) throws com.lowagie.text.DocumentException {
        com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(headers.length);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10f);
        
        // Header
        for (String header : headers) {
            com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Paragraph(header, com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 10, java.awt.Color.WHITE)));
            cell.setBackgroundColor(new java.awt.Color(60, 60, 60));
            cell.setPadding(6);
            table.addCell(cell);
        }

        // Rows
        com.lowagie.text.Font cellFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA, 9);
        boolean alternate = false;
        for (String[] row : rows) {
            for (String cellText : row) {
                com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Paragraph(cellText, cellFont));
                cell.setPadding(6);
                if (alternate) cell.setBackgroundColor(new java.awt.Color(245, 245, 245));
                table.addCell(cell);
            }
            alternate = !alternate;
        }

        document.add(table);
    }

    private void addKPISection(com.lowagie.text.Document document, List<TopProductDTO> products) throws com.lowagie.text.DocumentException {
        com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10f);
        table.setSpacingAfter(10f);

        double totalRevenue = products.stream().mapToDouble(p -> p.getPrice() * Math.max(0, 100 - p.getStock())).sum(); // Simulated revenue
        double avgPrice = products.stream().mapToDouble(TopProductDTO::getPrice).average().orElse(0.0);
        double avgRating = products.stream().mapToDouble(TopProductDTO::getRating).average().orElse(0.0);

        addKPICell(table, "Total Produits", String.valueOf(products.size()));
        addKPICell(table, "Prix Moyen", String.format("%.2f €", avgPrice));
        addKPICell(table, "Note Moyenne", String.format("%.1f ★", avgRating));
        addKPICell(table, "CA Estimé", String.format("%.0f €", totalRevenue));

        document.add(table);
    }

    private void addKPICell(com.lowagie.text.pdf.PdfPTable table, String label, String value) {
        com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell();
        cell.setBackgroundColor(new java.awt.Color(240, 240, 240));
        cell.setPadding(10);
        cell.addElement(new com.lowagie.text.Paragraph(label, com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA, 10)));
        cell.addElement(new com.lowagie.text.Paragraph(value, com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 12, java.awt.Color.DARK_GRAY)));
        table.addCell(cell);
    }

    private void addCharts(com.lowagie.text.Document document, List<TopProductDTO> products) throws Exception {
        // Prepare Dataset for Pie Chart (Category Distribution)
        org.jfree.data.general.DefaultPieDataset dataset = new org.jfree.data.general.DefaultPieDataset();
        products.stream()
                .collect(Collectors.groupingBy(TopProductDTO::getCategoryName, Collectors.counting()))
                .forEach(dataset::setValue);

        // Create Chart
        org.jfree.chart.JFreeChart chart = org.jfree.chart.ChartFactory.createPieChart(
                "Répartition par Catégorie", dataset, true, true, false);
        
        // Customizing Chart
        org.jfree.chart.plot.PiePlot plot = (org.jfree.chart.plot.PiePlot) chart.getPlot();
        plot.setBackgroundPaint(java.awt.Color.white);
        plot.setOutlineVisible(false);

        // Convert to Image
        java.awt.image.BufferedImage bufferedImage = chart.createBufferedImage(500, 300);
        com.lowagie.text.Image image = com.lowagie.text.Image.getInstance(writerImageToByteArray(bufferedImage));
        image.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        
        document.add(image);
        document.add(new com.lowagie.text.Paragraph(" "));
    }

    private byte[] writerImageToByteArray(java.awt.image.BufferedImage image) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        javax.imageio.ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }

    private void addDataTable(com.lowagie.text.Document document, List<TopProductDTO> products) throws com.lowagie.text.DocumentException {
        com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(new float[]{3, 2, 1, 1, 1});
        table.setWidthPercentage(100);
        
        // Header
        String[] headers = {"Produit", "Catégorie", "Prix", "Note", "Stock"};
        for (String header : headers) {
            com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Paragraph(header, com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 10, java.awt.Color.WHITE)));
            cell.setBackgroundColor(java.awt.Color.GRAY);
            cell.setPadding(5);
            table.addCell(cell);
        }

        // Rows
        com.lowagie.text.Font cellFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA, 9);
        for (TopProductDTO p : products) {
            table.addCell(new com.lowagie.text.Paragraph(p.getTitle(), cellFont));
            table.addCell(new com.lowagie.text.Paragraph(p.getCategoryName(), cellFont));
            table.addCell(new com.lowagie.text.Paragraph(String.format("%.2f €", p.getPrice()), cellFont));
            table.addCell(new com.lowagie.text.Paragraph(String.valueOf(p.getRating()), cellFont));
            table.addCell(new com.lowagie.text.Paragraph(String.valueOf(p.getStock()), cellFont));
        }

        document.add(table);
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