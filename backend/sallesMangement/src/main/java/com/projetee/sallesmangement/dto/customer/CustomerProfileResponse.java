package com.projetee.sallesmangement.dto.customer;

import lombok.Data;

/**
 * DTO pour le profil client.
 */
@Data
public class CustomerProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String phone;
    private Integer loyaltyPoints;
    private Integer totalOrders;
    private Double totalSpent;
    private String memberSince;
    private boolean active;
}
