package com.projetee.sallesmangement.dto.order;

import lombok.Data;

/**
 * DTO pour créer une commande Click & Collect à partir du panier.
 */
@Data
public class CreateOrderRequest {

    /**
     * Notes ou instructions spéciales pour la commande.
     */
    private String notes;
}
