package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.ml.ChatRequest;
import com.projetee.sallesmangement.dto.ml.ChatResponse;
import com.projetee.sallesmangement.service.ChatbotServiceClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chatbot", description = "Endpoints pour le chatbot IA")
public class ChatbotController {

    private final ChatbotServiceClient chatbotServiceClient;

    @PostMapping("/message")
    @Operation(summary = "Envoyer un message au chatbot")
    public ResponseEntity<ChatResponse> sendMessage(@RequestBody ChatRequest request) {
        log.info(" Message reçu: {}",
                request.getMessage() != null
                        ? request.getMessage().substring(0, Math.min(50, request.getMessage().length())) + "..."
                        : "null");

        ChatResponse response = chatbotServiceClient.sendMessage(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/clear")
    @Operation(summary = "Effacer l'historique de conversation")
    public ResponseEntity<Map<String, Object>> clearHistory(@RequestBody Map<String, String> request) {
        String userId = request.getOrDefault("userId", "anonymous");
        log.info("🧹 Effacement historique pour: {}", userId);

        Map<String, Object> response = chatbotServiceClient.clearHistory(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @Operation(summary = "Recherche rapide de produits")
    public ResponseEntity<Map<String, Object>> quickSearch(
            @RequestParam String q,
            @RequestParam(defaultValue = "5") int limit) {
        log.info("🔍 Recherche rapide: {}", q);

        Map<String, Object> response = chatbotServiceClient.quickSearch(q, limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/top-products")
    @Operation(summary = "Top produits")
    public ResponseEntity<Map<String, Object>> topProducts(
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(defaultValue = "sales") String sort) {
        log.info("🏆 Top produits: limit={}, sort={}", limit, sort);

        Map<String, Object> response = chatbotServiceClient.getTopProducts(limit, sort);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    @Operation(summary = "Vérifier le statut du chatbot et du LLM")
    public ResponseEntity<Map<String, Object>> getStatus() {
        log.info(" Demande statut chatbot");

        Map<String, Object> health = chatbotServiceClient.getServiceHealth();
        boolean serviceAvailable = chatbotServiceClient.isServiceAvailable();

        return ResponseEntity.ok(Map.of(
                "chatbotAvailable", serviceAvailable,
                "serviceHealth", health));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check du service chatbot")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        boolean available = chatbotServiceClient.isServiceAvailable();

        return ResponseEntity.ok(Map.of(
                "status", available ? "healthy" : "unhealthy",
                "available", available));
    }

    @GetMapping("/cache/stats")
    @Operation(summary = "Statistiques du cache du chatbot")
    public ResponseEntity<Map<String, Object>> cacheStats() {
        Map<String, Object> stats = chatbotServiceClient.getCacheStats();
        return ResponseEntity.ok(stats);
    }
}
