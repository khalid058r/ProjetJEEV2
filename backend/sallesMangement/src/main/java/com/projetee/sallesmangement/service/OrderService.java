package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.order.CreateOrderRequest;
import com.projetee.sallesmangement.dto.order.OrderHistoryResponse;
import com.projetee.sallesmangement.dto.order.OrderResponse;

import java.util.List;

/**
 * Service pour la gestion des commandes client (Click & Collect).
 */
public interface OrderService {

    /**
     * Crée une commande à partir du panier du client.
     */
    OrderResponse createOrder(Long customerId, CreateOrderRequest request);

    /**
     * Récupère une commande par son ID.
     */
    OrderResponse getOrder(Long customerId, Long orderId);

    /**
     * Récupère l'historique des commandes d'un client.
     */
    OrderHistoryResponse getOrderHistory(Long customerId);

    /**
     * Annule une commande (si possible).
     */
    OrderResponse cancelOrder(Long customerId, Long orderId);

    /**
     * Récupère une commande par son code de retrait.
     */
    OrderResponse getOrderByPickupCode(String pickupCode);

    // ============ MÉTHODES POUR VENDEURS ============

    /**
     * Liste toutes les commandes Click & Collect.
     */
    List<OrderResponse> getAllOnlineOrders();

    /**
     * Liste les commandes en attente de préparation.
     */
    List<OrderResponse> getPendingOrders();

    /**
     * Confirme une commande.
     */
    OrderResponse confirmOrder(Long orderId, Long vendorId);

    /**
     * Met une commande en préparation.
     */
    OrderResponse processOrder(Long orderId, Long vendorId);

    /**
     * Marque une commande comme prête à récupérer.
     */
    OrderResponse markAsReady(Long orderId, Long vendorId);

    /**
     * Marque une commande comme récupérée par le client.
     */
    OrderResponse markAsCompleted(Long orderId, Long vendorId);

    /**
     * Rejette une commande avec une raison.
     */
    OrderResponse rejectOrder(Long orderId, Long vendorId, String reason);
}
