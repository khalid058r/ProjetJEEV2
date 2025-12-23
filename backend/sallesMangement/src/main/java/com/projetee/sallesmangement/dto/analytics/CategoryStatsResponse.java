package com.projetee.sallesmangement.dto.analytics;

import lombok.Data;

@Data
public class CategoryStatsResponse {

    private Long categoryId;
    private String categoryName;

    private double totalRevenue;
    private long totalSold;
    private double averagePrice;

    private Long bestSellerProductId;
    private String bestSellerProductTitle;
}
