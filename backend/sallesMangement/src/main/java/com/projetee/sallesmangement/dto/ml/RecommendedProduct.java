package com.projetee.sallesmangement.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour un produit recommandé
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendedProduct {
    private Long id;
    private String name;
    private String category;
    private Double price;
    private Double rating;
    private Integer stock;
    private Double similarityScore;
    private String reason;
    private String imageUrl;
}
