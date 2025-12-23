package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardKPI {
    private Long totalProducts;
    private Long totalCategories;
    private Double averagePrice;
    private Double averageRating;
}