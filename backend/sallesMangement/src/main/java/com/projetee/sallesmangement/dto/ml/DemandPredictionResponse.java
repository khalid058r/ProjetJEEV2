package com.projetee.sallesmangement.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la réponse de prédiction de demande
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandPredictionResponse {
    private boolean success;
    private String demandLevel;
    private Double demandScore;
    private String stockRecommendation;
    private Integer suggestedReorder;
    private Double confidence;
    private String modelUsed;
    private String error;
}
