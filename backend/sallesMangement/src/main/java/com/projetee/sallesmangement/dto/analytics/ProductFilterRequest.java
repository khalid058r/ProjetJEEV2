package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterRequest {
    private Long categoryId;
    private Double minPrice;
    private Double maxPrice;
    private String sortBy; // rank, price_asc, price_desc, rating, reviews
}