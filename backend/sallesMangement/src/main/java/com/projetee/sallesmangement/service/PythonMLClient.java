package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.ml.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class PythonMLClient {

    private final RestTemplate restTemplate;

    @Value("${python.ml.service.url:http://localhost:5000}")
    private String pythonMlServiceUrl;

    public PythonMLClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public PricePredictionResponse predictPrice(ProductInputDTO product) {
        String url = pythonMlServiceUrl + "/api/ml/v2/predict/price";
        log.info("📊 Appel ML prédiction prix: {}", url);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<ProductInputDTO> request = new HttpEntity<>(product, headers);

            ResponseEntity<PricePredictionResponse> response = restTemplate.postForEntity(
                    url, request, PricePredictionResponse.class);

            log.info(" Prédiction prix reçue");
            return response.getBody();
        } catch (RestClientException e) {
            log.error("Erreur prédiction prix: {}", e.getMessage());
            return PricePredictionResponse.builder()
                    .success(false)
                    .error("Service ML indisponible: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Prédit la demande pour un produit
     */
    public DemandPredictionResponse predictDemand(ProductInputDTO product) {
        String url = pythonMlServiceUrl + "/api/ml/v2/predict/demand";
        log.info("Appel ML prédiction demande: {}", url);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<ProductInputDTO> request = new HttpEntity<>(product, headers);

            ResponseEntity<DemandPredictionResponse> response = restTemplate.postForEntity(
                    url, request, DemandPredictionResponse.class);

            log.info("Prédiction demande reçue");
            return response.getBody();
        } catch (RestClientException e) {
            log.error("Erreur prédiction demande: {}", e.getMessage());
            return DemandPredictionResponse.builder()
                    .success(false)
                    .error("Service ML indisponible: " + e.getMessage())
                    .build();
        }
    }

    public BestsellerPredictionResponse predictBestseller(ProductInputDTO product) {
        String url = pythonMlServiceUrl + "/api/ml/v2/predict/bestseller";
        log.info("Appel ML prédiction bestseller: {}", url);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<ProductInputDTO> request = new HttpEntity<>(product, headers);

            ResponseEntity<BestsellerPredictionResponse> response = restTemplate.postForEntity(
                    url, request, BestsellerPredictionResponse.class);

            log.info("Prédiction bestseller reçue");
            return response.getBody();
        } catch (RestClientException e) {
            log.error("Erreur prédiction bestseller: {}", e.getMessage());
            return BestsellerPredictionResponse.builder()
                    .success(false)
                    .error("Service ML indisponible: " + e.getMessage())
                    .build();
        }
    }

    @SuppressWarnings("unchecked")
    public RecommendationResponse getSimilarProducts(Long productId, int limit) {
        String url = pythonMlServiceUrl + "/api/recommendations/similar/" + productId + "?limit=" + limit;
        log.info(" Appel recommandations similaires: {}", url);

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && Boolean.TRUE.equals(body.get("success"))) {
                List<Map<String, Object>> recs = (List<Map<String, Object>>) body.get("recommendations");
                List<RecommendedProduct> products = recs.stream()
                        .map(this::mapToRecommendedProduct)
                        .toList();

                return RecommendationResponse.builder()
                        .success(true)
                        .productId(productId)
                        .recommendations(products)
                        .recommendationType("similar")
                        .build();
            }

            return RecommendationResponse.builder()
                    .success(false)
                    .error("Réponse invalide du service")
                    .build();
        } catch (Exception e) {
            log.error("Erreur recommandations similaires: {}", e.getMessage());
            return RecommendationResponse.builder()
                    .success(false)
                    .error("Service ML indisponible ou erreur de données: " + e.getMessage())
                    .build();
        }
    }

    @SuppressWarnings("unchecked")
    public RecommendationResponse getUpsellProducts(Long productId, int limit) {
        String url = pythonMlServiceUrl + "/api/recommendations/upsell/" + productId + "?limit=" + limit;
        log.info(" Appel recommandations upsell: {}", url);

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && Boolean.TRUE.equals(body.get("success"))) {
                List<Map<String, Object>> recs = (List<Map<String, Object>>) body.get("recommendations");
                List<RecommendedProduct> products = recs.stream()
                        .map(this::mapToRecommendedProduct)
                        .toList();

                return RecommendationResponse.builder()
                        .success(true)
                        .productId(productId)
                        .recommendations(products)
                        .recommendationType("upsell")
                        .build();
            }

            return RecommendationResponse.builder()
                    .success(false)
                    .error("Réponse invalide du service")
                    .build();
        } catch (Exception e) {
            log.error("Erreur recommandations upsell: {}", e.getMessage());
            return RecommendationResponse.builder()
                    .success(false)
                    .error("Service ML indisponible ou erreur de données: " + e.getMessage())
                    .build();
        }
    }

    @SuppressWarnings("unchecked")
    public RecommendationResponse getCrossSellProducts(Long productId, int limit) {
        String url = pythonMlServiceUrl + "/api/recommendations/crosssell/" + productId + "?limit=" + limit;
        log.info("🛒 Appel recommandations cross-sell: {}", url);

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && Boolean.TRUE.equals(body.get("success"))) {
                List<Map<String, Object>> recs = (List<Map<String, Object>>) body.get("recommendations");
                List<RecommendedProduct> products = recs.stream()
                        .map(this::mapToRecommendedProduct)
                        .toList();

                return RecommendationResponse.builder()
                        .success(true)
                        .productId(productId)
                        .recommendations(products)
                        .recommendationType("cross-sell")
                        .build();
            }

            return RecommendationResponse.builder()
                    .success(false)
                    .error("Réponse invalide du service")
                    .build();
        } catch (Exception e) {
            log.error("Erreur recommandations cross-sell: {}", e.getMessage());
            return RecommendationResponse.builder()
                    .success(false)
                    .error("Service ML indisponible ou erreur de données: " + e.getMessage())
                    .build();
        }
    }

    @SuppressWarnings("unchecked")
    public AnalyticsKPIsResponse getKPIs() {
        String url = pythonMlServiceUrl + "/api/analytics/kpis";
        log.info("📈 Appel KPIs analytics: {}", url);

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null) {
                return AnalyticsKPIsResponse.builder()
                        .success(Boolean.TRUE.equals(body.get("success")))
                        .productsAnalyzed(safeInt(body.get("products_analyzed")))
                        .message((String) body.get("message"))
                        .build();
            }

            return AnalyticsKPIsResponse.builder()
                    .success(false)
                    .message("Réponse invalide")
                    .build();
        } catch (Exception e) {
            log.error(" Erreur KPIs: {}", e.getMessage());
            return AnalyticsKPIsResponse.builder()
                    .success(false)
                    .message("Service ML indisponible: " + e.getMessage())
                    .build();
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getTrends() {
        String url = pythonMlServiceUrl + "/api/analytics/trends";
        log.info("Appel analyse tendances: {}", url);

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("❌ Erreur tendances: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    public boolean isServiceAvailable() {
        String url = pythonMlServiceUrl + "/api/health";
        log.debug(" Health check: {}", url);

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (RestClientException e) {
            log.warn("⚠️ Service Python ML indisponible: {}", e.getMessage());
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getServiceHealth() {
        String url = pythonMlServiceUrl + "/api/health";

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            return Map.of(
                    "status", "unavailable",
                    "error", e.getMessage(),
                    "service_url", pythonMlServiceUrl);
        }
    }

    private RecommendedProduct mapToRecommendedProduct(Map<String, Object> map) {
        return RecommendedProduct.builder()
                .id(safeLong(map.get("id")))
                .name((String) map.get("name"))
                .category((String) map.get("category"))
                .price(safeDouble(map.get("price")))
                .rating(safeDouble(map.get("rating")))
                .stock(safeInt(map.get("stock")))
                .similarityScore(safeDouble(map.get("similarity_score")))
                .reason((String) map.get("reason"))
                .imageUrl((String) map.get("image_url"))
                .build();
    }

    // ============================================================================
    // NOUVELLES MÉTHODES - Recherche sémantique et analyse
    // ============================================================================

    /**
     * Recherche sémantique de produits
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> semanticSearch(String query, int topK) {
        String url = pythonMlServiceUrl + "/api/ml/search?query=" + query + "&top_k=" + topK;
        log.info("🔍 Recherche sémantique: {}", url);

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("❌ Erreur recherche: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /**
     * Analyse complète d'un produit
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> analyzeProduct(ProductInputDTO product) {
        String url = pythonMlServiceUrl + "/api/ml/analyze";
        log.info("📊 Analyse produit: {}", url);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<ProductInputDTO> request = new HttpEntity<>(product, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("❌ Erreur analyse: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /**
     * Obtient le statut du service ML
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getMlStatus() {
        String url = pythonMlServiceUrl + "/api/ml/status";

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.warn("⚠️ Status ML indisponible: {}", e.getMessage());
            return Map.of("ready", false, "error", e.getMessage());
        }
    }

    /**
     * Recharge les modèles ML (hot reload)
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> reloadModels() {
        String url = pythonMlServiceUrl + "/api/ml/reload";
        log.info("🔄 Reload modèles ML: {}", url);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, null, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("❌ Erreur reload: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /**
     * Entraîne les modèles avec les données Java
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> trainFromJava() {
        String url = pythonMlServiceUrl + "/api/ml/train-from-java";
        log.info("🎓 Entraînement depuis Java: {}", url);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, null, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("❌ Erreur entraînement: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /**
     * Health check détaillé (readiness)
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getReadiness() {
        String url = pythonMlServiceUrl + "/api/health/ready";

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            return Map.of(
                    "ready", false,
                    "error", e.getMessage(),
                    "service_url", pythonMlServiceUrl);
        }
    }

    /**
     * Métriques du service
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getMetrics() {
        String url = pythonMlServiceUrl + "/api/metrics";

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.warn("⚠️ Métriques indisponibles: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private Long safeLong(Object value) {
        if (value == null)
            return null;
        if (value instanceof Number)
            return ((Number) value).longValue();
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Double safeDouble(Object value) {
        if (value == null)
            return null;
        if (value instanceof Number)
            return ((Number) value).doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer safeInt(Object value) {
        if (value == null)
            return null;
        if (value instanceof Number)
            return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
