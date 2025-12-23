package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KPIResponse {
    private Totals totals;
    private Sales sales;
    private Performance performance;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Totals {
        private Long products;
        private Long categories;
        private Long users;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Sales {
        private Long salesCount;
        private Double totalRevenue;
        private Double currentMonthRevenue;
        private Double averageBasket;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Performance {
        private String bestCategory;
        private String bestSellerProduct;
    }

}
