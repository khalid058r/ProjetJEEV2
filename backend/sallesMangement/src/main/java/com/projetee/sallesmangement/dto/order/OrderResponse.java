package com.projetee.sallesmangement.dto.order;

import com.projetee.sallesmangement.dto.lignevente.LigneVenteResponse;
import lombok.Data;

import java.util.List;


@Data
public class OrderResponse {

    private Long id;
    private String orderDate;
    private Double totalAmount;
    private String status;
    private String saleType;

    // Informations client
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    // Click & Collect
    private String pickupCode;
    private String estimatedPickupTime;
    private String actualPickupTime;
    private String notes;

    // Articles
    private List<LigneVenteResponse> items;

    // Points de fidélité gagnés
    private Integer loyaltyPointsEarned;
}
