package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.customer.CustomerProfileResponse;
import com.projetee.sallesmangement.dto.customer.LoyaltyInfoResponse;
import com.projetee.sallesmangement.dto.customer.UpdateProfileRequest;


public interface CustomerService {

    CustomerProfileResponse getProfile(Long customerId);

    CustomerProfileResponse updateProfile(Long customerId, UpdateProfileRequest request);

    LoyaltyInfoResponse getLoyaltyInfo(Long customerId);

    String calculateLoyaltyTier(Integer points);
}
