package com.projetee.sallesmangement.dto.lignevente;

import lombok.Data;

@Data
public class LigneVenteResponse {

    private Long id;
    private Integer quantity;
    private Double unitPrice;
    private Double lineTotal;

    private Long productId;
    private String productTitle;

    private Long saleId;
}
