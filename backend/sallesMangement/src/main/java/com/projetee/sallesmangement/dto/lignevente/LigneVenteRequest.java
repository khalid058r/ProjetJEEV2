package com.projetee.sallesmangement.dto.lignevente;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

//@Data
//public class LigneVenteRequest {
//
//    @NotNull
//    private Integer quantity;
//
//    @NotNull
//    private Double unitPrice;
//
//    @NotNull
//    private Long productId;
//
//    @NotNull
//    private Long saleId;
//}

@Data
public class LigneVenteRequest {

    @NotNull
    private Long productId;

    @NotNull
    private Integer quantity;
}

