package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterResponse {
    private List<TopProductDTO> products;
    private Integer totalResults;
    private FilterMetadata metadata;
}