package com.projetee.sallesmangement.dto.sale;

import com.projetee.sallesmangement.dto.lignevente.LigneVenteRequest;
import com.projetee.sallesmangement.dto.lignevente.LigneVenteResponse;
import lombok.Data;

import java.util.List;


@Data
public class SaleResponse {

    private Long id;
    private String saleDate;
    private Double totalAmount;

    private Long userId;
    private String username;

    private String status;

    private List<LigneVenteResponse> lignes;
}

//@Data
//public class SaleResponse {
//
//    private Long id;
//    private String saleDate;
//    private Double totalAmount;
//
//    private Long userId;
//    private String username;
//
//    private List<LigneVenteRequest> lignes;
//}
