package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.cart.AddToCartRequest;
import com.projetee.sallesmangement.dto.cart.CartResponse;
import com.projetee.sallesmangement.dto.cart.UpdateCartItemRequest;

/**
 * Service pour la gestion du panier client.
 */
public interface CartService {

    /**
     * Récupère le panier d'un client. Crée un panier vide si inexistant.
     */
    CartResponse getCart(Long customerId);

    /**
     * Ajoute un produit au panier.
     */
    CartResponse addToCart(Long customerId, AddToCartRequest request);

    /**
     * Met à jour la quantité d'un article.
     */
    CartResponse updateCartItem(Long customerId, Long itemId, UpdateCartItemRequest request);

    /**
     * Supprime un article du panier.
     */
    CartResponse removeFromCart(Long customerId, Long itemId);

    /**
     * Vide le panier.
     */
    void clearCart(Long customerId);

    /**
     * Compte le nombre d'articles dans le panier.
     */
    Integer getCartItemCount(Long customerId);
}
