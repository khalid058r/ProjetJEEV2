package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.order.*;
import com.projetee.sallesmangement.entity.Role;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * Contrôleur pour la gestion des commandes Click & Collect.
 * 
 * - Clients (ACHETEUR): créer, voir, annuler leurs commandes
 * - Vendeurs (VENDEUR/ADMIN): voir commandes en attente, marquer comme prêt/complété
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ============ ENDPOINTS CLIENT (ACHETEUR) ============

    /**
     * Crée une commande à partir du panier.
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        validateCustomerRole(role);
        OrderResponse order = orderService.createOrder(userId, request);
        return ResponseEntity
                .created(URI.create("/api/orders/" + order.getId()))
                .body(order);
    }

    /**
     * Récupère une commande par son ID.
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long orderId
    ) {
        validateCustomerRole(role);
        return ResponseEntity.ok(orderService.getOrder(userId, orderId));
    }

    /**
     * Récupère l'historique des commandes du client.
     */
    @GetMapping("/history")
    public ResponseEntity<OrderHistoryResponse> getOrderHistory(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role
    ) {
        validateCustomerRole(role);
        return ResponseEntity.ok(orderService.getOrderHistory(userId));
    }

    /**
     * Annule une commande.
     */
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long orderId
    ) {
        validateCustomerRole(role);
        return ResponseEntity.ok(orderService.cancelOrder(userId, orderId));
    }

    /**
     * Récupère une commande par son code de retrait (pour vérification).
     */
    @GetMapping("/pickup/{pickupCode}")
    public ResponseEntity<OrderResponse> getOrderByPickupCode(
            @PathVariable String pickupCode
    ) {
        return ResponseEntity.ok(orderService.getOrderByPickupCode(pickupCode));
    }

    // ============ ENDPOINTS VENDEUR (ADMIN/VENDEUR) ============

    /**
     * Liste les commandes en attente de préparation.
     */
    @GetMapping("/pending")
    public ResponseEntity<List<OrderResponse>> getPendingOrders(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role
    ) {
        validateVendorRole(role);
        return ResponseEntity.ok(orderService.getPendingOrders());
    }

    /**
     * Marque une commande comme prête à récupérer.
     */
    @PostMapping("/{orderId}/ready")
    public ResponseEntity<OrderResponse> markAsReady(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long orderId
    ) {
        validateVendorRole(role);
        return ResponseEntity.ok(orderService.markAsReady(orderId, userId));
    }

    /**
     * Marque une commande comme récupérée par le client.
     */
    @PostMapping("/{orderId}/complete")
    public ResponseEntity<OrderResponse> markAsCompleted(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long orderId
    ) {
        validateVendorRole(role);
        return ResponseEntity.ok(orderService.markAsCompleted(orderId, userId));
    }

    // ============ VALIDATION ============

    private void validateCustomerRole(Role role) {
        if (role != Role.ACHETEUR) {
            throw new BadRequestException("Only customers (ACHETEUR) can access orders");
        }
    }

    private void validateVendorRole(Role role) {
        if (role != Role.ADMIN && role != Role.VENDEUR) {
            throw new BadRequestException("Only vendors can manage orders");
        }
    }
}
