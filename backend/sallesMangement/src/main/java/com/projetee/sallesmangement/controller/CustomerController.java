package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.customer.CustomerProfileResponse;
import com.projetee.sallesmangement.dto.customer.LoyaltyInfoResponse;
import com.projetee.sallesmangement.dto.customer.UpdateProfileRequest;
import com.projetee.sallesmangement.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST pour la gestion du profil client (ACHETEUR).
 * Permet aux clients de gérer leur profil et consulter leurs points de
 * fidélité.
 */
@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    /**
     * Récupère le profil du client connecté.
     * GET /api/customer/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<CustomerProfileResponse> getProfile(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(customerService.getProfile(userId));
    }

    /**
     * Met à jour le profil du client connecté.
     * PUT /api/customer/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<CustomerProfileResponse> updateProfile(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(customerService.updateProfile(userId, request));
    }

    /**
     * Récupère les informations de fidélité du client.
     * GET /api/customer/loyalty
     */
    @GetMapping("/loyalty")
    public ResponseEntity<LoyaltyInfoResponse> getLoyaltyInfo(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(customerService.getLoyaltyInfo(userId));
    }
}
