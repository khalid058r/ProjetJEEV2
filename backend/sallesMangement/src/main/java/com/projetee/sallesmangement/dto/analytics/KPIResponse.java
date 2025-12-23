package com.projetee.sallesmangement.dto.analytics;

import lombok.Data;

@Data
public class KPIResponse {

    private Totals totals;
    private Sales sales;
    private Performance performance;

    @Data
    public static class Totals {
        private long products;
        private long categories;
        private long users;
    }

    @Data
    public static class Sales {
        private long salesCount;
        private double totalRevenue;
        private double currentMonthRevenue;
        private double averageBasket;
    }

    @Data
    public static class Performance {
        private String bestCategory;
        private String bestSellerProduct;
    }
}
