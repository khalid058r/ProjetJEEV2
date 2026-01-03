package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.cart.*;
import com.projetee.sallesmangement.entity.Role;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;


    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role
    ) {
        validateCustomerRole(role);
        return ResponseEntity.ok(cartService.getCart(userId));
    }


    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @Valid @RequestBody AddToCartRequest request
    ) {
        validateCustomerRole(role);
        return ResponseEntity.ok(cartService.addToCart(userId, request));
    }

    /**
     * Met à jour la quantité d'un article.
     */
    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> updateCartItem(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        validateCustomerRole(role);
        return ResponseEntity.ok(cartService.updateCartItem(userId, itemId, request));
    }

    /**
     * Supprime un article du panier.
     */
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> removeFromCart(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long itemId
    ) {
        validateCustomerRole(role);
        return ResponseEntity.ok(cartService.removeFromCart(userId, itemId));
    }

    /**
     * Vide le panier.
     */
    @DeleteMapping
    public ResponseEntity<Void> clearCart(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role
    ) {
        validateCustomerRole(role);
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Compte le nombre d'articles dans le panier.
     */
    @GetMapping("/count")
    public ResponseEntity<Integer> getCartItemCount(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role
    ) {
        validateCustomerRole(role);
        return ResponseEntity.ok(cartService.getCartItemCount(userId));
    }

    private void validateCustomerRole(Role role) {
        if (role != Role.ACHETEUR) {
            throw new BadRequestException("Only customers (ACHETEUR) can access the cart");
        }
    }
}
