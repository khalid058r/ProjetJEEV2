package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.lignevente.LigneVenteRequest;
import com.projetee.sallesmangement.dto.sale.SaleRequest;
import com.projetee.sallesmangement.dto.sale.SaleResponse;
import com.projetee.sallesmangement.entity.*;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.mapper.SaleMapper;
import com.projetee.sallesmangement.repository.ProductRepository;
import com.projetee.sallesmangement.repository.SaleRepository;
import com.projetee.sallesmangement.repository.UserRepository;
import com.projetee.sallesmangement.service.SaleService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SaleServiceImpl implements SaleService {

    private final SaleRepository saleRepo;
    private final UserRepository userRepo;
    private final ProductRepository productRepo;
    private final SaleMapper saleMapper;

    @Override
    @Transactional
    public SaleResponse create(SaleRequest request) {

        User user = userRepo.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.ADMIN && user.getRole() != Role.VENDEUR) {
            throw new BadRequestException("User not allowed to create sales");
        }

        Sale sale = new Sale();
        sale.setSaleDate(LocalDate.now());
        sale.setUser(user);
        sale.setStatus(SaleStatus.CONFIRMED);
        sale.setTotalAmount(0.0);
        sale.setLignesVente(new ArrayList<>());

        double total = 0;

        for (LigneVenteRequest lineReq : request.getLignes()) {

            Product product = productRepo.findById(lineReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

            if (lineReq.getQuantity() <= 0) {
                throw new BadRequestException("Quantity must be > 0");
            }

            if (product.getStock() < lineReq.getQuantity()) {
                throw new BadRequestException("Not enough stock for product: " + product.getTitle());
            }

            product.setStock(product.getStock() - lineReq.getQuantity());
            productRepo.save(product);

            LigneVente lv = new LigneVente();
            lv.setSale(sale);
            lv.setProduct(product);
            lv.setQuantity(lineReq.getQuantity());
            lv.setUnitPrice(product.getPrice());
            lv.setLineTotal(product.getPrice() * lineReq.getQuantity());

            sale.getLignesVente().add(lv);
            total += lv.getLineTotal();
        }

        sale.setTotalAmount(total);
        Sale saved = saleRepo.save(sale);

        return saleMapper.toResponse(saved);
    }

    @Override
    public SaleResponse get(Long id) {
        Sale sale = saleRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
        return saleMapper.toResponse(sale);
    }

    // @Override
    // public List<SaleResponse> getAll() {
    // return saleRepo.findAll()
    // .stream()
    // .map(saleMapper::toResponse)
    // .toList();
    // }

    @Override
    public List<SaleResponse> getAll(Long userId, Role role) {

        List<Sale> sales;

        if (role == Role.ADMIN) {
            // Si l'utilisateur est un admin, récupérer toutes les ventes
            sales = saleRepo.findAll();
        } else if (role == Role.VENDEUR) {
            // Si l'utilisateur est un vendeur, récupérer uniquement ses ventes
            sales = saleRepo.findByUserId(userId);
        } else {
            throw new BadRequestException("Unauthorized role");
        }

        return sales.stream()
                .map(saleMapper::toResponse)
                .toList();
    }

    // @Override
    // public Page<SaleResponse> getPaginated(int page, int size) {
    // Pageable pageable = PageRequest.of(page, size);
    // return saleRepo.findAll(pageable)
    // .map(saleMapper::toResponse);
    // }

    @Override
    public Page<SaleResponse> getPaginated(Long userId, Role role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        Page<Sale> salesPage;

        if (role == Role.ADMIN) {
            // Admin : Récupère toutes les ventes
            salesPage = saleRepo.findAll(pageable);
        } else if (role == Role.VENDEUR) {
            // Vendeur : Récupère uniquement les ventes de ce vendeur
            salesPage = saleRepo.findByUserId(userId, pageable);
        } else {
            throw new BadRequestException("Unauthorized role");
        }

        return salesPage.map(saleMapper::toResponse);
    }

    @Override
    public List<SaleResponse> getRecent(int limit) {
        // Récupère les ventes récentes sans authentification (pour analytics)
        Pageable pageable = PageRequest.of(0, limit, org.springframework.data.domain.Sort.by("saleDate").descending());
        return saleRepo.findAll(pageable)
                .stream()
                .map(saleMapper::toResponse)
                .toList();
    }

    @Override
    public void delete(Long id) {
        Sale sale = saleRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
        saleRepo.delete(sale);
    }

    @Override
    @Transactional
    public SaleResponse cancel(Long id) {

        Sale sale = saleRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));

        if (sale.getStatus() == SaleStatus.CANCELLED) {
            throw new BadRequestException("Sale already cancelled");
        }

        for (LigneVente lv : sale.getLignesVente()) {
            Product p = lv.getProduct();
            p.setStock(p.getStock() + lv.getQuantity());
            productRepo.save(p);
        }

        sale.setStatus(SaleStatus.CANCELLED);
        saleRepo.save(sale);

        return saleMapper.toResponse(sale);
    }
}
