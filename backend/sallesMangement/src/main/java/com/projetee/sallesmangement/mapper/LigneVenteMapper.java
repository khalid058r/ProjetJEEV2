package com.projetee.sallesmangement.mapper;

import com.projetee.sallesmangement.dto.lignevente.LigneVenteRequest;
import com.projetee.sallesmangement.dto.lignevente.LigneVenteResponse;
import com.projetee.sallesmangement.entity.LigneVente;
import com.projetee.sallesmangement.entity.Product;
import com.projetee.sallesmangement.entity.Sale;
import com.projetee.sallesmangement.repository.ProductRepository;
import com.projetee.sallesmangement.repository.SaleRepository;
import org.springframework.stereotype.Component;


@Component
public class LigneVenteMapper {

    public LigneVenteResponse toResponse(LigneVente entity) {
        LigneVenteResponse dto = new LigneVenteResponse();

        dto.setId(entity.getId());
        dto.setQuantity(entity.getQuantity());
        dto.setUnitPrice(entity.getUnitPrice());
        dto.setLineTotal(entity.getLineTotal());

        dto.setProductId(entity.getProduct().getId());
        dto.setProductTitle(entity.getProduct().getTitle());

        dto.setSaleId(entity.getSale().getId());

        return dto;
    }
}

//@Component
//public class LigneVenteMapper {
//
//    private final ProductRepository productRepository;
//    private final SaleRepository saleRepository;
//
//    public LigneVenteMapper(ProductRepository productRepository, SaleRepository saleRepository) {
//        this.productRepository = productRepository;
//        this.saleRepository = saleRepository;
//    }
//
//    public LigneVente toEntity(LigneVenteRequest dto) {
//        LigneVente entity = new LigneVente();
//
//        entity.setQuantity(dto.getQuantity());
//        entity.setUnitPrice(dto.getUnitPrice());
//        entity.setLineTotal(dto.getQuantity() * dto.getUnitPrice());
//
//        Product product = productRepository.findById(dto.getProductId())
//                .orElseThrow(() -> new RuntimeException("Product not found"));
//        entity.setProduct(product);
//
//        Sale sale = saleRepository.findById(dto.getSaleId())
//                .orElseThrow(() -> new RuntimeException("Sale not found"));
//        entity.setSale(sale);
//
//        return entity;
//    }
//
//    public LigneVenteResponse toResponse(LigneVente entity) {
//        LigneVenteResponse dto = new LigneVenteResponse();
//
//        dto.setId(entity.getId());
//        dto.setQuantity(entity.getQuantity());
//        dto.setUnitPrice(entity.getUnitPrice());
//        dto.setLineTotal(entity.getLineTotal());
//
//        dto.setProductId(entity.getProduct().getId());
//        dto.setProductTitle(entity.getProduct().getTitle());
//
//        dto.setSaleId(entity.getSale().getId());
//
//        return dto;
//    }
//}
