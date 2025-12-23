package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryAnalysisResponse {
    private Long categoryId;
    private String categoryName;
    private Double averagePrice;
    private TopProductDTO bestRatedProduct;
    private TopProductDTO bestSellerProduct;
    private List<RatingDistribution> ratingDistribution;
}