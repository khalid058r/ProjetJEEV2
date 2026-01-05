package com.projetee.sallesmangement.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la réponse de prédiction de bestseller
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BestsellerPredictionResponse {
    private boolean success;
    private Boolean isBestseller;
    private Double bestsellerProbability;
    private String prediction;
    private String marketingRecommendation;
    private Double confidence;
    private String modelUsed;
    private String error;
}
