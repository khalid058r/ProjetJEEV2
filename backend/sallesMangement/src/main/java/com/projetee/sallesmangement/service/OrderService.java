package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.order.CreateOrderRequest;
import com.projetee.sallesmangement.dto.order.OrderHistoryResponse;
import com.projetee.sallesmangement.dto.order.OrderResponse;

import java.util.List;


public interface OrderService {

    OrderResponse createOrder(Long customerId, CreateOrderRequest request);

    OrderResponse getOrder(Long customerId, Long orderId);

    OrderHistoryResponse getOrderHistory(Long customerId);

    OrderResponse cancelOrder(Long customerId, Long orderId);

    OrderResponse getOrderByPickupCode(String pickupCode);


    List<OrderResponse> getAllOnlineOrders();

    List<OrderResponse> getPendingOrders();

    OrderResponse confirmOrder(Long orderId, Long vendorId);

    OrderResponse processOrder(Long orderId, Long vendorId);

    OrderResponse markAsReady(Long orderId, Long vendorId);

    OrderResponse markAsCompleted(Long orderId, Long vendorId);

    OrderResponse rejectOrder(Long orderId, Long vendorId, String reason);
}
