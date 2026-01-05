package com.projetee.sallesmangement.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO pour la réponse de recommandation de produits
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    private boolean success;
    private Long productId;
    private String productName;
    private List<RecommendedProduct> recommendations;
    private String recommendationType;
    private String error;
}
