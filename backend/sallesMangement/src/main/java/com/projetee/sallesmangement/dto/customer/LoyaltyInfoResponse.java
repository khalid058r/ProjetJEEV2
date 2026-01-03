package com.projetee.sallesmangement.dto.customer;

import lombok.Data;

import java.util.List;

/**
 * DTO pour les informations de fidélité client.
 */
@Data
public class LoyaltyInfoResponse {
    private Long customerId;
    private String customerName;
    private Integer currentPoints;
    private String loyaltyTier; // BRONZE, SILVER, GOLD, PLATINUM
    private Integer pointsToNextTier;
    private Double totalSpent;
    private List<PointsHistoryItem> recentActivity;

    @Data
    public static class PointsHistoryItem {
        private String date;
        private String description;
        private Integer pointsChange; // Positif = gagné, négatif = utilisé
        private Integer balanceAfter;
    }
}
