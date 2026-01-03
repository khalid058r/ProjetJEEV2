package com.projetee.sallesmangement.dto.cart;

import lombok.Data;

/**
 * DTO pour un article du panier dans la réponse.
 */
@Data
public class CartItemResponse {

    private Long id;
    private Long productId;
    private String productTitle;
    private String productImageUrl;
    private Double unitPrice;
    private Integer quantity;
    private Double lineTotal;
    private Integer availableStock;
}
