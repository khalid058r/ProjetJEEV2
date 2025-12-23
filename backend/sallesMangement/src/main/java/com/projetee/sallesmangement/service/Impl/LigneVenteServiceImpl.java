package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.lignevente.LigneVenteRequest;
import com.projetee.sallesmangement.dto.lignevente.LigneVenteResponse;
import com.projetee.sallesmangement.entity.*;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.mapper.LigneVenteMapper;
import com.projetee.sallesmangement.repository.LigneVenteRepository;
import com.projetee.sallesmangement.repository.ProductRepository;
import com.projetee.sallesmangement.repository.SaleRepository;
import com.projetee.sallesmangement.service.LigneVenteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LigneVenteServiceImpl implements LigneVenteService {

    private final LigneVenteRepository ligneRepo;
    private final ProductRepository productRepo;
    private final SaleRepository saleRepo;
    private final LigneVenteMapper mapper;

    @Override
    @Transactional
    public LigneVenteResponse addLine(Long saleId, LigneVenteRequest request) {

        Sale sale = saleRepo.findById(saleId)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));

        if (sale.getStatus() == SaleStatus.CANCELLED) {
            throw new BadRequestException("Cannot add line: sale is cancelled");
        }

        Product product = productRepo.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (request.getQuantity() <= 0) {
            throw new BadRequestException("Quantity must be > 0");
        }

        if (product.getStock() < request.getQuantity()) {
            throw new BadRequestException("Not enough stock");
        }

        product.setStock(product.getStock() - request.getQuantity());
        productRepo.save(product);

        LigneVente lv = new LigneVente();
        lv.setSale(sale);
        lv.setProduct(product);
        lv.setQuantity(request.getQuantity());
        lv.setUnitPrice(product.getPrice());
        lv.setLineTotal(product.getPrice() * request.getQuantity());

        sale.getLignesVente().add(lv);
        sale.setTotalAmount(sale.getTotalAmount() + lv.getLineTotal());

        saleRepo.save(sale);

        return mapper.toResponse(lv);
    }

    @Override
    @Transactional
    public LigneVenteResponse updateLine(Long lineId, LigneVenteRequest request) {

        LigneVente lv = ligneRepo.findById(lineId)
                .orElseThrow(() -> new ResourceNotFoundException("Line not found"));

        Sale sale = lv.getSale();
        Product product = lv.getProduct();

        if (sale.getStatus() == SaleStatus.CANCELLED) {
            throw new BadRequestException("Cannot update line: sale is cancelled");
        }

        if (request.getQuantity() <= 0) {
            throw new BadRequestException("Quantity must be > 0");
        }

        // ✅ CORRECTION: Calculer delta au lieu de restaurer/re-diminuer
        int oldQuantity = lv.getQuantity();
        int newQuantity = request.getQuantity();
        int delta = newQuantity - oldQuantity;

        // Si on augmente la quantité, vérifier stock disponible
        if (delta > 0 && product.getStock() < delta) {
            throw new BadRequestException("Not enough stock to update (need " + delta + " more)");
        }

        // Appliquer le delta au stock
        product.setStock(product.getStock() - delta);
        productRepo.save(product);

        // Mettre à jour le montant total de la vente
        double oldLineTotal = lv.getLineTotal();
        lv.setQuantity(newQuantity);
        lv.setLineTotal(product.getPrice() * newQuantity);
        double newLineTotal = lv.getLineTotal();

        sale.setTotalAmount(sale.getTotalAmount() - oldLineTotal + newLineTotal);
        saleRepo.save(sale);

        return mapper.toResponse(lv);
    }




    @Override
    @Transactional
    public void deleteLine(Long id) {

        LigneVente lv = ligneRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Line not found"));

        Sale sale = lv.getSale();
        Product product = lv.getProduct();

        if (sale.getStatus() == SaleStatus.CANCELLED) {
            throw new BadRequestException("Cannot delete line: sale is cancelled");
        }

        product.setStock(product.getStock() + lv.getQuantity());
        productRepo.save(product);

        sale.setTotalAmount(sale.getTotalAmount() - lv.getLineTotal());

        ligneRepo.delete(lv);
        saleRepo.save(sale);
    }

    @Override
    public LigneVenteResponse get(Long id) {
        return ligneRepo.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Line not found"));
    }

    @Override
    public Page<LigneVenteResponse> getPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ligneRepo.findAll(pageable).map(mapper::toResponse);
    }
}
