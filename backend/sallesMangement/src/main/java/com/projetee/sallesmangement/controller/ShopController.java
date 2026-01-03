package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.category.CategoryResponse;
import com.projetee.sallesmangement.dto.product.ProductResponse;
import com.projetee.sallesmangement.entity.Role;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.service.CategoryService;
import com.projetee.sallesmangement.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur pour la boutique en ligne (catalogue produits pour clients).
 * Accessible à tous les utilisateurs authentifiés, mais optimisé pour ACHETEUR.
 */
@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {

    private final ProductService productService;
    private final CategoryService categoryService;

    /**
     * Liste toutes les catégories.
     */
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAll());
    }

    /**
     * Liste tous les produits disponibles (avec stock > 0).
     */
    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> getAvailableProducts() {
        // Réutilise le service existant
        List<ProductResponse> products = productService.getAll();

        // Filtrer les produits avec stock > 0
        List<ProductResponse> available = products.stream()
                .filter(p -> p.getStock() != null && p.getStock() > 0)
                .toList();

        return ResponseEntity.ok(available);
    }

    /**
     * Liste les produits avec pagination.
     */
    @GetMapping("/products/page")
    public ResponseEntity<Page<ProductResponse>> getProductsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "title") String sortBy) {
        return ResponseEntity.ok(productService.getPaginated(page, size, sortBy));
    }

    /**
     * Récupère un produit par son ID.
     */
    @GetMapping("/products/{id}")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.get(id));
    }

    /**
     * Récupère le profil du client (points de fidélité, etc.).
     * Cet endpoint pourrait être étendu avec plus d'infos.
     */
    @GetMapping("/profile")
    public ResponseEntity<CustomerProfileResponse> getProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role) {
        if (role != Role.ACHETEUR) {
            throw new BadRequestException("Only customers can access profile");
        }

        // Pour l'instant on retourne juste l'ID
        // L'implémentation complète nécessiterait un service dédié
        CustomerProfileResponse response = new CustomerProfileResponse();
        response.setUserId(userId);
        response.setMessage("Profile endpoint - to be enhanced");
        return ResponseEntity.ok(response);
    }

    /**
     * DTO simple pour le profil client.
     */
    @lombok.Data
    public static class CustomerProfileResponse {
        private Long userId;
        private String message;
        private Integer loyaltyPoints;
        private Integer totalOrders;
    }
}
