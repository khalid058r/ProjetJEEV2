package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopProductDTO {
    private Long id;
    private String asin;
    private String title;
    private String categoryName;
    private Double price;
    private Double rating;
    private Integer reviewCount;
    private Integer rank;
    private Integer stock;
    private String imageUrl;
}