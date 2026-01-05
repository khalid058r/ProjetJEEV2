package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.ml.*;
import com.projetee.sallesmangement.entity.Product;
import com.projetee.sallesmangement.repository.ProductRepository;
import com.projetee.sallesmangement.service.PythonMLClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * Controller pour les endpoints de Machine Learning
 * Proxy vers le service Python ML pour les prédictions
 */
@RestController
@RequestMapping("/api/ml")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Machine Learning", description = "Endpoints pour les prédictions ML")
public class MLController {

    private final PythonMLClient pythonMLClient;
    private final ProductRepository productRepository;

    // =====================================================
    // PRÉDICTIONS
    // =====================================================

    @PostMapping("/predict/price")
    @Operation(summary = "Prédire le prix optimal d'un produit")
    public ResponseEntity<PricePredictionResponse> predictPrice(@RequestBody ProductInputDTO product) {
        log.info("🔮 Demande prédiction prix pour: {}", product.getName());
        PricePredictionResponse response = pythonMLClient.predictPrice(product);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/predict/demand")
    @Operation(summary = "Prédire la demande d'un produit")
    public ResponseEntity<DemandPredictionResponse> predictDemand(@RequestBody ProductInputDTO product) {
        log.info("📊 Demande prédiction demande pour: {}", product.getName());
        DemandPredictionResponse response = pythonMLClient.predictDemand(product);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/predict/bestseller")
    @Operation(summary = "Prédire si un produit sera un bestseller")
    public ResponseEntity<BestsellerPredictionResponse> predictBestseller(@RequestBody ProductInputDTO product) {
        log.info("⭐ Demande prédiction bestseller pour: {}", product.getName());
        BestsellerPredictionResponse response = pythonMLClient.predictBestseller(product);
        return ResponseEntity.ok(response);
    }

    // =====================================================
    // PRÉDICTIONS PAR ID PRODUIT (utilise données DB)
    // =====================================================

    @GetMapping("/predict/price/{productId}")
    @Operation(summary = "Prédire le prix optimal pour un produit existant par son ID")
    public ResponseEntity<?> predictPriceForProduct(@PathVariable Long productId) {
        log.info("🔮 Demande prédiction prix pour produit ID: {}", productId);

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        ProductInputDTO input = mapProductToInput(product);

        PricePredictionResponse response = pythonMLClient.predictPrice(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/predict/demand/{productId}")
    @Operation(summary = "Prédire la demande pour un produit existant par son ID")
    public ResponseEntity<?> predictDemandForProduct(@PathVariable Long productId) {
        log.info("📊 Demande prédiction demande pour produit ID: {}", productId);

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        ProductInputDTO input = mapProductToInput(product);

        DemandPredictionResponse response = pythonMLClient.predictDemand(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/predict/bestseller/{productId}")
    @Operation(summary = "Prédire si un produit existant sera un bestseller")
    public ResponseEntity<?> predictBestsellerForProduct(@PathVariable Long productId) {
        log.info("⭐ Demande prédiction bestseller pour produit ID: {}", productId);

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        ProductInputDTO input = mapProductToInput(product);

        BestsellerPredictionResponse response = pythonMLClient.predictBestseller(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/predict/all/{productId}")
    @Operation(summary = "Obtenir toutes les prédictions pour un produit")
    public ResponseEntity<?> getAllPredictionsForProduct(@PathVariable Long productId) {
        log.info("🔮📊⭐ Demande toutes prédictions pour produit ID: {}", productId);

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        ProductInputDTO input = mapProductToInput(product);

        PricePredictionResponse pricePred = pythonMLClient.predictPrice(input);
        DemandPredictionResponse demandPred = pythonMLClient.predictDemand(input);
        BestsellerPredictionResponse bestsellerPred = pythonMLClient.predictBestseller(input);

        return ResponseEntity.ok(Map.of(
                "productId", productId,
                "productName", product.getTitle(),
                "pricePrediction", pricePred,
                "demandPrediction", demandPred,
                "bestsellerPrediction", bestsellerPred));
    }

    // =====================================================
    // HEALTH
    // =====================================================

    @GetMapping("/health")
    @Operation(summary = "Vérifier la disponibilité du service ML")
    public ResponseEntity<Map<String, Object>> getMLServiceHealth() {
        Map<String, Object> health = pythonMLClient.getServiceHealth();
        boolean available = pythonMLClient.isServiceAvailable();

        return ResponseEntity.ok(Map.of(
                "mlServiceAvailable", available,
                "details", health));
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private ProductInputDTO mapProductToInput(Product product) {
        return ProductInputDTO.builder()
                .name(product.getTitle())
                .category(product.getCategory() != null ? product.getCategory().getName() : "Unknown")
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .price(product.getPrice())
                .stock(product.getStock())
                .rank(product.getRank())
                .build();
    }
}
