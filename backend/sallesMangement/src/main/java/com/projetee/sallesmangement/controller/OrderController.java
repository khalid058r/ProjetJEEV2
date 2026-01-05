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


@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;


    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @Valid @RequestBody CreateOrderRequest request) {
        validateCustomerRole(role);
        OrderResponse order = orderService.createOrder(userId, request);
        return ResponseEntity
                .created(URI.create("/api/orders/" + order.getId()))
                .body(order);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long orderId) {
        validateCustomerRole(role);
        return ResponseEntity.ok(orderService.getOrder(userId, orderId));
    }

    @GetMapping("/history")
    public ResponseEntity<OrderHistoryResponse> getOrderHistory(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role) {
        validateCustomerRole(role);
        return ResponseEntity.ok(orderService.getOrderHistory(userId));
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long orderId) {
        validateCustomerRole(role);
        return ResponseEntity.ok(orderService.cancelOrder(userId, orderId));
    }

    @GetMapping("/pickup/{pickupCode}")
    public ResponseEntity<OrderResponse> getOrderByPickupCode(
            @PathVariable String pickupCode) {
        return ResponseEntity.ok(orderService.getOrderByPickupCode(pickupCode));
    }

    // ============ ENDPOINTS VENDEUR (ADMIN/VENDEUR) ============

    @GetMapping("/all")
    public ResponseEntity<List<OrderResponse>> getAllOrders(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role) {
        validateVendorRole(role);
        return ResponseEntity.ok(orderService.getAllOnlineOrders());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<OrderResponse>> getPendingOrders(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role) {
        validateVendorRole(role);
        return ResponseEntity.ok(orderService.getPendingOrders());
    }

    @PostMapping("/{orderId}/confirm")
    public ResponseEntity<OrderResponse> confirmOrder(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long orderId) {
        validateVendorRole(role);
        return ResponseEntity.ok(orderService.confirmOrder(orderId, userId));
    }

    @PostMapping("/{orderId}/process")
    public ResponseEntity<OrderResponse> processOrder(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long orderId) {
        validateVendorRole(role);
        return ResponseEntity.ok(orderService.processOrder(orderId, userId));
    }

    @PostMapping("/{orderId}/ready")
    public ResponseEntity<OrderResponse> markAsReady(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long orderId) {
        validateVendorRole(role);
        return ResponseEntity.ok(orderService.markAsReady(orderId, userId));
    }

    @PostMapping("/{orderId}/complete")
    public ResponseEntity<OrderResponse> markAsCompleted(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long orderId) {
        validateVendorRole(role);
        return ResponseEntity.ok(orderService.markAsCompleted(orderId, userId));
    }

    @PostMapping("/{orderId}/reject")
    public ResponseEntity<OrderResponse> rejectOrder(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @PathVariable Long orderId,
            @RequestBody(required = false) RejectOrderRequest request) {
        validateVendorRole(role);
        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(orderService.rejectOrder(orderId, userId, reason));
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
