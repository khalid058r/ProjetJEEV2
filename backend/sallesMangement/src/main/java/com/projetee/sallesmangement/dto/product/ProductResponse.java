package com.projetee.sallesmangement.dto.product;

import lombok.Data;
@Data
public class ProductResponse {

    private Long id;
    private String asin;
    private String title;
    private Double price;
    private Double rating;
    private Integer reviewCount;
    private Integer rank;
    private String imageUrl;

    private Long categoryId;
    private String categoryName;
    private Integer stock;
}
