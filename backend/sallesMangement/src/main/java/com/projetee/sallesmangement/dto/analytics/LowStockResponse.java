package com.projetee.sallesmangement.dto.analytics;

import lombok.Data;

@Data
public class LowStockResponse {

    private Long productId;
    private String title;
    private String categoryName;
    private int stock;
}
