package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.cart.*;
import com.projetee.sallesmangement.entity.*;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.repository.CartItemRepository;
import com.projetee.sallesmangement.repository.CartRepository;
import com.projetee.sallesmangement.repository.ProductRepository;
import com.projetee.sallesmangement.repository.UserRepository;
import com.projetee.sallesmangement.service.CartService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.stream.Collectors;

/**
 * Implémentation du service de gestion du panier.
 */
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepo;
    private final CartItemRepository cartItemRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;

    @Override
    public CartResponse getCart(Long customerId) {
        // Vérifier que l'utilisateur est un client
        User customer = getCustomerOrThrow(customerId);

        // Récupérer ou créer le panier
        Cart cart = cartRepo.findByCustomerId(customerId)
                .orElseGet(() -> createEmptyCart(customer));

        return mapToResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addToCart(Long customerId, AddToCartRequest request) {
        User customer = getCustomerOrThrow(customerId);

        // Vérifier le produit
        Product product = productRepo.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Vérifier le stock
        if (product.getStock() < request.getQuantity()) {
            throw new BadRequestException("Not enough stock. Available: " + product.getStock());
        }

        // Récupérer ou créer le panier
        Cart cart = cartRepo.findByCustomerId(customerId)
                .orElseGet(() -> createEmptyCart(customer));

        // Vérifier si le produit est déjà dans le panier
        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(request.getProductId()))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            // Mettre à jour la quantité
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (product.getStock() < newQuantity) {
                throw new BadRequestException("Not enough stock. Available: " + product.getStock());
            }
            existingItem.setQuantity(newQuantity);
        } else {
            // Ajouter nouvel article
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();
            cart.getItems().add(newItem);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        Cart saved = cartRepo.save(cart);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CartResponse updateCartItem(Long customerId, Long itemId, UpdateCartItemRequest request) {
        getCustomerOrThrow(customerId);

        Cart cart = cartRepo.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        // Vérifier le stock
        if (item.getProduct().getStock() < request.getQuantity()) {
            throw new BadRequestException("Not enough stock. Available: " + item.getProduct().getStock());
        }

        item.setQuantity(request.getQuantity());
        cart.setUpdatedAt(LocalDateTime.now());

        Cart saved = cartRepo.save(cart);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CartResponse removeFromCart(Long customerId, Long itemId) {
        getCustomerOrThrow(customerId);

        Cart cart = cartRepo.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        boolean removed = cart.getItems().removeIf(item -> item.getId().equals(itemId));
        if (!removed) {
            throw new ResourceNotFoundException("Cart item not found");
        }

        cart.setUpdatedAt(LocalDateTime.now());
        Cart saved = cartRepo.save(cart);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void clearCart(Long customerId) {
        getCustomerOrThrow(customerId);

        Cart cart = cartRepo.findByCustomerId(customerId).orElse(null);
        if (cart != null) {
            cart.getItems().clear();
            cart.setUpdatedAt(LocalDateTime.now());
            cartRepo.save(cart);
        }
    }

    @Override
    public Integer getCartItemCount(Long customerId) {
        return cartRepo.countItemsByCustomerId(customerId);
    }

    // ============ MÉTHODES PRIVÉES ============

    private User getCustomerOrThrow(Long customerId) {
        User user = userRepo.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.ACHETEUR) {
            throw new BadRequestException("User is not a customer (ACHETEUR)");
        }

        if (!user.isActive()) {
            throw new BadRequestException("Account is not active");
        }

        return user;
    }

    private Cart createEmptyCart(User customer) {
        Cart cart = Cart.builder()
                .customer(customer)
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return cartRepo.save(cart);
    }

    private CartResponse mapToResponse(Cart cart) {
        CartResponse response = new CartResponse();
        response.setId(cart.getId());
        response.setCustomerId(cart.getCustomer().getId());
        response.setCustomerName(cart.getCustomer().getUsername());
        response.setTotalItems(cart.getTotalItems());
        response.setTotalAmount(cart.getTotalAmount());
        response.setCreatedAt(cart.getCreatedAt().toString());
        response.setUpdatedAt(cart.getUpdatedAt() != null ? cart.getUpdatedAt().toString() : null);

        response.setItems(cart.getItems().stream()
                .map(this::mapItemToResponse)
                .collect(Collectors.toList()));

        return response;
    }

    private CartItemResponse mapItemToResponse(CartItem item) {
        CartItemResponse response = new CartItemResponse();
        response.setId(item.getId());
        response.setProductId(item.getProduct().getId());
        response.setProductTitle(item.getProduct().getTitle());
        response.setProductImageUrl(item.getProduct().getImageUrl());
        response.setUnitPrice(item.getUnitPrice());
        response.setQuantity(item.getQuantity());
        response.setLineTotal(item.getLineTotal());
        response.setAvailableStock(item.getProduct().getStock());
        return response;
    }
}
