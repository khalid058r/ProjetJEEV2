package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.cart.AddToCartRequest;
import com.projetee.sallesmangement.dto.cart.CartResponse;
import com.projetee.sallesmangement.dto.cart.UpdateCartItemRequest;

/**
 * Service pour la gestion du panier client.
 */
public interface CartService {

    CartResponse getCart(Long customerId);

    CartResponse addToCart(Long customerId, AddToCartRequest request);

    CartResponse updateCartItem(Long customerId, Long itemId, UpdateCartItemRequest request);

    CartResponse removeFromCart(Long customerId, Long itemId);

    void clearCart(Long customerId);

    Integer getCartItemCount(Long customerId);
}
