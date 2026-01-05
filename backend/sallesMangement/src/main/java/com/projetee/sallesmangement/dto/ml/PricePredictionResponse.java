package com.projetee.sallesmangement.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la réponse de prédiction de prix
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricePredictionResponse {
    private boolean success;
    private Double predictedPrice;
    private Double currentPrice;
    private Double priceDifference;
    private Double priceChangePercent;
    private String recommendation;
    private Double confidence;
    private String modelUsed;
    private String error;
}
