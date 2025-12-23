package com.projetee.sallesmangement.dto.analytics;

import lombok.Data;

@Data
public class TopProductResponse {

    private Long productId;
    private String title;
    private String categoryName;

    private double price;
    private double rating;

    private long quantitySold;
    private double revenue;
}
