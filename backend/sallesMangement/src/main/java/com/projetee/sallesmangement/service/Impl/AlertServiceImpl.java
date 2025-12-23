package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.alert.AlertResponse;
import com.projetee.sallesmangement.dto.alert.AlertSummary;
import com.projetee.sallesmangement.entity.*;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.repository.*;
import com.projetee.sallesmangement.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertServiceImpl implements AlertService {

    private final AlertRepository alertRepo;
    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;


    @Override
    @Transactional
    public List<AlertResponse> detectNewTop10Products() {
        log.info("detection  Top 10");
        List<AlertResponse> alerts = new ArrayList<>();

        List<Product> top10 = productRepo.findAllOrderByRankAsc()
                .stream()
                .limit(10)
                .toList();

        for (Product p : top10) {
            LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
            if (alertRepo.existsRecentAlert(AlertType.NEW_TOP10_PRODUCT, p.getId(), yesterday)) {
                continue;
            }

            Alert alert = Alert.builder()
                    .type(AlertType.NEW_TOP10_PRODUCT)
                    .title("Nouveau Top 10")
                    .message(String.format("%s est maintenant #%d dans le classement",
                            p.getTitle(), p.getRank()))
                    .priority(AlertPriority.HIGH)
                    .createdAt(LocalDateTime.now())
                    .product(p)
                    .metadata(String.format("{\"rank\": %d, \"category\": \"%s\"}",
                            p.getRank(), p.getCategory().getName()))
                    .build();

            Alert saved = alertRepo.save(alert);
            alerts.add(toResponse(saved));
        }

        log.info(" {} alertes Top 10 générées", alerts.size());
        return alerts;
    }

    @Override
    @Transactional
    public List<AlertResponse> detectTop10Categories() {
        log.info("🔍 Détection catégories dominantes Top 10...");
        List<AlertResponse> alerts = new ArrayList<>();

        List<Product> top10 = productRepo.findAllOrderByRankAsc()
                .stream()
                .limit(10)
                .toList();

        Map<Category, Long> categoryCount = new HashMap<>();
        for (Product p : top10) {
            categoryCount.merge(p.getCategory(), 1L, Long::sum);
        }

        for (Map.Entry<Category, Long> entry : categoryCount.entrySet()) {
            if (entry.getValue() >= 3) {
                Category cat = entry.getKey();

                // Évite doublons
                LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
                boolean hasRecent = alertRepo.findRecentAlerts(yesterday).stream()
                        .anyMatch(a -> a.getType() == AlertType.CATEGORY_IN_TOP10 &&
                                a.getCategory() != null &&
                                a.getCategory().getId().equals(cat.getId()));

                if (!hasRecent) {
                    Alert alert = Alert.builder()
                            .type(AlertType.CATEGORY_IN_TOP10)
                            .title("Catégorie Dominante")
                            .message(String.format("%s domine avec %d produits dans le Top 10",
                                    cat.getName(), entry.getValue()))
                            .priority(AlertPriority.MEDIUM)
                            .createdAt(LocalDateTime.now())
                            .category(cat)
                            .metadata(String.format("{\"count\": %d}", entry.getValue()))
                            .build();

                    Alert saved = alertRepo.save(alert);
                    alerts.add(toResponse(saved));
                }
            }
        }

        log.info(" {} alertes catégories générées", alerts.size());
        return alerts;
    }

    @Override
    @Transactional
    public List<AlertResponse> detectLowStock() {
        log.info(" Détection stock faible...");
        List<AlertResponse> alerts = new ArrayList<>();

        int threshold = 10;
        List<Product> lowStockProducts = productRepo.findAll().stream()
                .filter(p -> p.getStock() != null && p.getStock() <= threshold)
                .toList();

        for (Product p : lowStockProducts) {
            // Évite doublons
            LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
            if (alertRepo.existsRecentAlert(AlertType.STOCK_LOW, p.getId(), yesterday)) {
                continue;
            }

            Alert alert = Alert.builder()
                    .type(AlertType.STOCK_LOW)
                    .title("Stock Faible")
                    .message(String.format("%s - Stock critique: %d unités restantes",
                            p.getTitle(), p.getStock()))
                    .priority(p.getStock() <= 5 ? AlertPriority.HIGH : AlertPriority.MEDIUM)
                    .createdAt(LocalDateTime.now())
                    .product(p)
                    .metadata(String.format("{\"stock\": %d, \"threshold\": %d}",
                            p.getStock(), threshold))
                    .build();

            Alert saved = alertRepo.save(alert);
            alerts.add(toResponse(saved));
        }

        log.info(" {} alertes stock générées", alerts.size());
        return alerts;
    }

    @Override
    @Transactional
    public List<AlertResponse> detectPriceDrops() {
        log.info("Détection baisses de prix...");
        // TODO: Nécessite historique prix pour détecter baisses
        return new ArrayList<>();
    }

    @Override
    @Transactional
    public Map<String, List<AlertResponse>> generateAllAlerts() {
        log.info(" Génération de toutes les alertes...");

        Map<String, List<AlertResponse>> result = new HashMap<>();
        result.put("newTop10", detectNewTop10Products());
        result.put("top10Categories", detectTop10Categories());
        result.put("lowStock", detectLowStock());
        result.put("priceDrops", detectPriceDrops());

        int total = result.values().stream().mapToInt(List::size).sum();
        log.info("Total: {} alertes générées", total);

        return result;
    }

    @Override
    public List<AlertResponse> getAllAlerts() {
        return alertRepo.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AlertResponse> getUnreadAlerts() {
        return alertRepo.findByIsReadFalseOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AlertResponse> getAlertsByType(AlertType type) {
        return alertRepo.findByTypeOrderByCreatedAtDesc(type).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AlertResponse> getAlertsForRole(Role role) {
        List<Alert> allAlerts = alertRepo.findByIsReadFalseOrderByCreatedAtDesc();

        return allAlerts.stream()
                .filter(alert -> isRelevantForRole(alert, role))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AlertSummary getAlertSummary() {
        long total = alertRepo.count();
        long unread = alertRepo.countByIsReadFalse();

        long highPriority = alertRepo.findByIsReadFalseOrderByCreatedAtDesc().stream()
                .filter(a -> a.getPriority() == AlertPriority.HIGH)
                .count();

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long today = alertRepo.findRecentAlerts(todayStart).size();

        return new AlertSummary(total, unread, highPriority, today);
    }

    @Override
    @Transactional
    public void markAsRead(Long alertId) {
        Alert alert = alertRepo.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));

        alert.setRead(true);
        alertRepo.save(alert);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        List<Alert> unreadAlerts = alertRepo.findByIsReadFalseOrderByCreatedAtDesc();
        unreadAlerts.forEach(a -> a.setRead(true));
        alertRepo.saveAll(unreadAlerts);
    }

    @Override
    @Transactional
    public void deleteAlert(Long alertId) {
        alertRepo.deleteById(alertId);
    }

    @Override
    @Transactional
    public void deleteOldAlerts(int daysOld) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(daysOld);
        List<Alert> oldAlerts = alertRepo.findAll().stream()
                .filter(a -> a.getCreatedAt().isBefore(cutoff))
                .toList();

        alertRepo.deleteAll(oldAlerts);
        log.info(" {} alertes anciennes supprimées", oldAlerts.size());
    }

    // ============ HELPERS ============

    private boolean isRelevantForRole(Alert alert, Role role) {
        switch (role) {
            case VENDEUR:
                return alert.getType() == AlertType.STOCK_LOW ||
                        alert.getType() == AlertType.RANK_IMPROVEMENT ||
                        alert.getType() == AlertType.COMPETITOR_ALERT;

            case ANALYSTE:
                return alert.getType() == AlertType.NEW_TOP10_PRODUCT ||
                        alert.getType() == AlertType.CATEGORY_IN_TOP10 ||
                        alert.getType() == AlertType.CATEGORY_TREND;

            case INVESTISSEUR:
                return alert.getType() == AlertType.CATEGORY_TREND ||
                        alert.getType() == AlertType.CATEGORY_IN_TOP10 ||
                        alert.getType() == AlertType.PRICE_DROP;

            case ACHETEUR:
                return alert.getType() == AlertType.PRICE_DROP ||
                        alert.getType() == AlertType.NEW_TOP10_PRODUCT;

            default:
                return true; // ADMIN voit tout
        }
    }

    private AlertResponse toResponse(Alert alert) {
        AlertResponse dto = new AlertResponse();
        dto.setId(alert.getId());
        dto.setType(alert.getType());
        dto.setTitle(alert.getTitle());
        dto.setMessage(alert.getMessage());
        dto.setPriority(alert.getPriority());
        dto.setCreatedAt(alert.getCreatedAt().format(FORMATTER));
        dto.setRead(alert.isRead());

        if (alert.getProduct() != null) {
            dto.setProductId(alert.getProduct().getId());
            dto.setProductTitle(alert.getProduct().getTitle());
        }

        if (alert.getCategory() != null) {
            dto.setCategoryId(alert.getCategory().getId());
            dto.setCategoryName(alert.getCategory().getName());
        }

        dto.setMetadata(alert.getMetadata());

        return dto;
    }
}