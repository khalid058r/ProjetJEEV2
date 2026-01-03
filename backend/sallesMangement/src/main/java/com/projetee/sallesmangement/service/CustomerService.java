package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.customer.CustomerProfileResponse;
import com.projetee.sallesmangement.dto.customer.LoyaltyInfoResponse;
import com.projetee.sallesmangement.dto.customer.UpdateProfileRequest;

/**
 * Service de gestion du profil client.
 */
public interface CustomerService {

    /**
     * Récupère le profil complet d'un client.
     */
    CustomerProfileResponse getProfile(Long customerId);

    /**
     * Met à jour le profil d'un client.
     */
    CustomerProfileResponse updateProfile(Long customerId, UpdateProfileRequest request);

    /**
     * Récupère les informations de fidélité d'un client.
     */
    LoyaltyInfoResponse getLoyaltyInfo(Long customerId);

    /**
     * Calcule le tier de fidélité en fonction des points.
     */
    String calculateLoyaltyTier(Integer points);
}
