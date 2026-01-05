package com.projetee.sallesmangement.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductInputDTO {
    private String name;
    private String category;
    private Double rating;
    private Integer reviewCount;
    private Double price;
    private Integer stock;
    private Integer rank;
}
