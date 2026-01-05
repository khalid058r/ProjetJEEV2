package com.projetee.sallesmangement.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

/**
 * DTO pour les KPIs analytics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsKPIsResponse {
    private boolean success;
    private Integer productsAnalyzed;
    private String message;
    private KPIsData data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KPIsData {
        private StockStats stockStats;
        private PriceStats priceStats;
        private RatingStats ratingStats;
        private InventoryValue inventoryValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockStats {
        private Integer totalProducts;
        private Integer inStock;
        private Integer outOfStock;
        private Integer lowStock;
        private Integer totalUnits;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceStats {
        private Double average;
        private Double median;
        private Double min;
        private Double max;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RatingStats {
        private Double average;
        private Integer topRated;
        private Integer belowAverage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryValue {
        private Double total;
        private Double average;
    }
}
