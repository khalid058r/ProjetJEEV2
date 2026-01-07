package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopProductResponse {
    private Long productId;
    private String title;
    private String categoryName;
    private Double price;
    private Double rating;
    private Long quantitySold;
    private Double revenue;
    private Integer stock;
}