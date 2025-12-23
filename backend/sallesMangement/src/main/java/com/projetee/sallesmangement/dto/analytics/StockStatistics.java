package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockStatistics {
    private Long lowStockProducts;
    private Long outOfStockProducts;
    private Integer threshold;
}