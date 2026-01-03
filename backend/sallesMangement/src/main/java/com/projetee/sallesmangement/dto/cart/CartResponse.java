package com.projetee.sallesmangement.dto.cart;

import lombok.Data;

import java.util.List;

/**
 * DTO pour la réponse du panier complet.
 */
@Data
public class CartResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private List<CartItemResponse> items;
    private Integer totalItems;
    private Double totalAmount;
    private String createdAt;
    private String updatedAt;
}
