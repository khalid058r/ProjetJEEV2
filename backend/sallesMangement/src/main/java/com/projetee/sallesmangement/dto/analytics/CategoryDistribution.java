package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDistribution {
    private String categoryName;
    private Long productCount;
    private Double averagePrice;
    private Double averageRating;
}