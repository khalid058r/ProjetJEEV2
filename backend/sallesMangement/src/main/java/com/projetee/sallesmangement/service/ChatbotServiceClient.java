package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.ml.ChatRequest;
import com.projetee.sallesmangement.dto.ml.ChatResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service client pour communiquer avec le chatbot-service (Flask)
 * Gère les conversations avec le LLM (Groq/Ollama)
 */
@Service
@Slf4j
public class ChatbotServiceClient {

    private final RestTemplate restTemplate;

    @Value("${chatbot.service.url:http://localhost:8001}")
    private String chatbotServiceUrl;

    public ChatbotServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // =====================================================
    // CHAT
    // =====================================================

    /**
     * Envoie un message au chatbot
     */
    @SuppressWarnings("unchecked")
    public ChatResponse sendMessage(ChatRequest request) {
        String url = chatbotServiceUrl + "/api/chat";
        log.info("💬 Appel chatbot: {}", url);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Mapper vers le format attendu par le chatbot-service Flask
            Map<String, Object> body = new HashMap<>();
            body.put("message", request.getMessage());
            body.put("userId", request.getUserId() != null ? request.getUserId() : "anonymous");
            body.put("userRole", "VENDEUR"); // ou passer depuis request

            HttpEntity<Map<String, Object>> httpRequest = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, httpRequest, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null) {
                return ChatResponse.builder()
                        .response((String) responseBody.get("response"))
                        .conversationId(request.getConversationId())
                        .intent((String) responseBody.get("intent"))
                        .confidence(responseBody.get("confidence") != null
                                ? ((Number) responseBody.get("confidence")).doubleValue()
                                : null)
                        .suggestedActions((List<Map<String, Object>>) responseBody.get("suggestions"))
                        .llmUsed((Boolean) responseBody.get("llm_used"))
                        .build();
            }

            return ChatResponse.builder()
                    .error("Réponse invalide du chatbot")
                    .build();
        } catch (RestClientException e) {
            log.error("❌ Erreur chatbot: {}", e.getMessage());
            return ChatResponse.builder()
                    .response("Désolé, le service de chat est temporairement indisponible.")
                    .error(e.getMessage())
                    .build();
        }
    }

    /**
     * Efface l'historique de conversation
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> clearHistory(String userId) {
        String url = chatbotServiceUrl + "/api/chat/clear";
        log.info("🧹 Effacement historique pour: {}", userId);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of("userId", userId != null ? userId : "anonymous");
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("❌ Erreur effacement historique: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    // =====================================================
    // QUICK ACTIONS
    // =====================================================

    /**
     * Recherche rapide de produits via le chatbot
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> quickSearch(String query, int limit) {
        String url = chatbotServiceUrl + "/api/quick/search?q=" + query + "&limit=" + limit;
        log.info("🔍 Recherche rapide: {}", query);

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("❌ Erreur recherche rapide: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /**
     * Top produits via le chatbot
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getTopProducts(int limit, String sortBy) {
        String url = chatbotServiceUrl + "/api/quick/top-products?limit=" + limit + "&sort=" + sortBy;
        log.info("🏆 Top produits: limit={}, sort={}", limit, sortBy);

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("❌ Erreur top produits: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    // =====================================================
    // HEALTH CHECK
    // =====================================================

    /**
     * Vérifie si le chatbot-service est disponible
     */
    public boolean isServiceAvailable() {
        String url = chatbotServiceUrl + "/api/health";
        log.debug("🏥 Health check chatbot: {}", url);

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (RestClientException e) {
            log.warn("⚠️ Chatbot service indisponible: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Obtient les détails de santé du service
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getServiceHealth() {
        String url = chatbotServiceUrl + "/api/health";

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            return Map.of(
                    "status", "unavailable",
                    "error", e.getMessage(),
                    "service_url", chatbotServiceUrl);
        }
    }

    /**
     * Obtient les statistiques du cache
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getCacheStats() {
        String url = chatbotServiceUrl + "/api/cache/stats";

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (RestClientException e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }
}
