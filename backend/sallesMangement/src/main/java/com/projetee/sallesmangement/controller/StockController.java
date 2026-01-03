package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.entity.Product;
import com.projetee.sallesmangement.repository.ProductRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {

    private final ProductRepository productRepository;

    // DTO simple pour éviter les boucles de sérialisation
    @Data
    static class ProductStockDTO {
        private Long id;
        private String asin;
        private String title;
        private Double price;
        private Integer stock;
        private Integer reservedStock;
        private String imageUrl;
        private String categoryName;

        public static ProductStockDTO from(Product p) {
            ProductStockDTO dto = new ProductStockDTO();
            dto.setId(p.getId());
            dto.setAsin(p.getAsin());
            dto.setTitle(p.getTitle());
            dto.setPrice(p.getPrice());
            dto.setStock(p.getStock() != null ? p.getStock() : 0);
            dto.setReservedStock(0); // Pas de stock réservé pour l'instant
            dto.setImageUrl(p.getImageUrl());
            dto.setCategoryName(p.getCategory() != null ? p.getCategory().getName() : null);
            return dto;
        }
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        try {
            long totalStock = productRepository.findAll().stream()
                    .mapToLong(p -> p.getStock() != null ? p.getStock() : 0)
                    .sum();

            long lowStockCount = productRepository.findAll().stream()
                    .filter(p -> p.getStock() != null && p.getStock() > 0 && p.getStock() < 10)
                    .count();

            long outOfStockCount = productRepository.findAll().stream()
                    .filter(p -> p.getStock() == null || p.getStock() == 0)
                    .count();

            return ResponseEntity.ok(Map.of(
                    "totalStock", totalStock,
                    "reservedStock", 0,
                    "availableStock", totalStock,
                    "lowStockCount", lowStockCount,
                    "outOfStockCount", outOfStockCount,
                    "value", 0));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage(), "trace", e.getStackTrace()[0].toString()));
        }
    }

    @GetMapping("/low")
    public ResponseEntity<?> getLowStock() {
        try {
            List<Product> allProducts = productRepository.findAll();
            List<ProductStockDTO> lowStock = allProducts.stream()
                    .filter(p -> p.getStock() != null && p.getStock() > 0 && p.getStock() < 10)
                    .map(ProductStockDTO::from)
                    .toList();
            return ResponseEntity.ok(lowStock);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @GetMapping("/out")
    public ResponseEntity<?> getOutOfStock() {
        try {
            List<Product> allProducts = productRepository.findAll();
            List<ProductStockDTO> outOfStock = allProducts.stream()
                    .filter(p -> p.getStock() == null || p.getStock() <= 0)
                    .map(ProductStockDTO::from)
                    .toList();
            return ResponseEntity.ok(outOfStock);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @GetMapping("/movements")
    public ResponseEntity<List<Object>> getMovements() {
        return ResponseEntity.ok(List.of()); // Empty list for now
    }

    @PostMapping("/add")
    public ResponseEntity<?> addStock(@RequestBody Map<String, Object> request) {
        try {
            Long productId = Long.valueOf(request.get("productId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé: " + productId));

            int currentStock = product.getStock() != null ? product.getStock() : 0;
            product.setStock(currentStock + quantity);
            productRepository.save(product);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Stock ajouté avec succès",
                    "product", ProductStockDTO.from(product)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage() != null ? e.getMessage() : "Erreur inconnue"));
        }
    }

    @PostMapping("/adjust")
    public ResponseEntity<?> adjustStock(@RequestBody Map<String, Object> request) {
        try {
            Long productId = Long.valueOf(request.get("productId").toString());
            Integer newQuantity = Integer.valueOf(request.get("newQuantity").toString());

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé: " + productId));

            int oldStock = product.getStock() != null ? product.getStock() : 0;
            product.setStock(newQuantity);
            productRepository.save(product);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Stock ajusté avec succès",
                    "oldStock", oldStock,
                    "newStock", newQuantity,
                    "product", ProductStockDTO.from(product)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage() != null ? e.getMessage() : "Erreur inconnue"));
        }
    }
}
