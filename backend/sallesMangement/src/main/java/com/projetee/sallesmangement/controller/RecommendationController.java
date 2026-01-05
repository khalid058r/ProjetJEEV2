package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.ml.RecommendationResponse;
import com.projetee.sallesmangement.service.PythonMLClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Recommendations", description = "Endpoints pour les recommandations de produits")
public class RecommendationController {

    private final PythonMLClient pythonMLClient;

    @GetMapping("/similar/{productId}")
    @Operation(summary = "Obtenir des produits similaires")
    public ResponseEntity<RecommendationResponse> getSimilarProducts(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "5") int limit) {

        log.info("🔍 Demande produits similaires pour ID: {} (limit: {})", productId, limit);
        RecommendationResponse response = pythonMLClient.getSimilarProducts(productId, limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/upsell/{productId}")
    @Operation(summary = "Obtenir des produits pour upsell (plus cher, meilleur)")
    public ResponseEntity<RecommendationResponse> getUpsellProducts(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "5") int limit) {

        log.info("💰 Demande produits upsell pour ID: {} (limit: {})", productId, limit);
        RecommendationResponse response = pythonMLClient.getUpsellProducts(productId, limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cross-sell/{productId}")
    @Operation(summary = "Obtenir des produits complémentaires")
    public ResponseEntity<RecommendationResponse> getCrossSellProducts(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "5") int limit) {

        log.info("🛒 Demande produits cross-sell pour ID: {} (limit: {})", productId, limit);
        RecommendationResponse response = pythonMLClient.getCrossSellProducts(productId, limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Obtenir toutes les recommandations pour un produit")
    public ResponseEntity<Map<String, Object>> getProductRecommendations(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "5") int limit) {

        log.info("📦 Demande toutes recommandations pour ID: {} (limit: {})", productId, limit);

        try {
            RecommendationResponse similar = pythonMLClient.getSimilarProducts(productId, limit);
            RecommendationResponse upsell = pythonMLClient.getUpsellProducts(productId, limit);
            RecommendationResponse crossSell = pythonMLClient.getCrossSellProducts(productId, limit);

            return ResponseEntity.ok(Map.of(
                    "productId", productId,
                    "similar", similar != null ? similar : RecommendationResponse.builder().success(false).error("Null response").build(),
                    "upsell", upsell != null ? upsell : RecommendationResponse.builder().success(false).error("Null response").build(),
                    "crossSell", crossSell != null ? crossSell : RecommendationResponse.builder().success(false).error("Null response").build()));
        } catch (Exception e) {
            log.error("❌ Erreur critique dans le contrôleur de recommandations: {}", e.getMessage(), e);
            // Return a safe fallback response instead of 500
            RecommendationResponse errorResponse = RecommendationResponse.builder()
                    .success(false)
                    .error("Erreur serveur interne: " + e.getMessage())
                    .build();
            
            return ResponseEntity.ok(Map.of(
                    "productId", productId,
                    "similar", errorResponse,
                    "upsell", errorResponse,
                    "crossSell", errorResponse,
                    "error", "Une erreur est survenue lors de la récupération des recommandations"));
        }
    }

    @GetMapping("/all/{productId}")
    @Operation(summary = "Obtenir toutes les recommandations (alias)")
    public ResponseEntity<Map<String, Object>> getAllRecommendations(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "5") int limit) {
        return getProductRecommendations(productId, limit);
    }
}
