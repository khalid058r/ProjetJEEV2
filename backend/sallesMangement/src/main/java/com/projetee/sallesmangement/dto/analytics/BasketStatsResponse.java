package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BasketStatsResponse {
    private Double averageBasketValue;
    private Double averageItems;
    private Long totalItemsSold;
    private Double variance;
    private Double standardDeviation;
    private java.util.List<ProductAssociation> associations;
}