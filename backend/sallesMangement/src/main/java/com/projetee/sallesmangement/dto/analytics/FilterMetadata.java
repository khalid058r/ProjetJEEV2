package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FilterMetadata {
    private Double minPrice;
    private Double maxPrice;
    private String appliedSort;
    private Long categoryId;
}