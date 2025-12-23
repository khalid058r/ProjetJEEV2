package com.projetee.sallesmangement.dto.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProductRequest {

    @NotBlank
    private String asin;

    @NotBlank
    private String title;

    @NotNull
    private Double price;
    @NotBlank
    private String imageUrl;

    private Double rating;
    private Integer reviewCount;
    private Integer rank;

    @NotNull
    private Integer stock;

    @NotNull
    private Long categoryId;
}
