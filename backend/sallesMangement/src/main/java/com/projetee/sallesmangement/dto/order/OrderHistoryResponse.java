package com.projetee.sallesmangement.dto.order;

import lombok.Data;

import java.util.List;

/**
 * DTO pour la liste des commandes d'un client.
 */
@Data
public class OrderHistoryResponse {

    private Long customerId;
    private String customerName;
    private Integer totalOrders;
    private Double totalSpent;
    private Integer loyaltyPoints;
    private List<OrderSummary> orders;

    @Data
    public static class OrderSummary {
        private Long id;
        private String orderDate;
        private Double totalAmount;
        private String status;
        private String pickupCode;
        private Integer itemCount;
    }
}
