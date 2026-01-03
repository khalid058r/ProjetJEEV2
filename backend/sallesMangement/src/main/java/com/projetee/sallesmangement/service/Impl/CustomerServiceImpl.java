package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.customer.CustomerProfileResponse;
import com.projetee.sallesmangement.dto.customer.LoyaltyInfoResponse;
import com.projetee.sallesmangement.dto.customer.UpdateProfileRequest;
import com.projetee.sallesmangement.entity.Role;
import com.projetee.sallesmangement.entity.Sale;
import com.projetee.sallesmangement.entity.SaleStatus;
import com.projetee.sallesmangement.entity.User;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.repository.SaleRepository;
import com.projetee.sallesmangement.repository.UserRepository;
import com.projetee.sallesmangement.service.CustomerService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Implémentation du service client.
 */
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final UserRepository userRepo;
    private final SaleRepository saleRepo;

    @Override
    public CustomerProfileResponse getProfile(Long customerId) {
        User customer = getCustomerOrThrow(customerId);
        List<Sale> orders = saleRepo.findByCustomerId(customerId);

        CustomerProfileResponse response = new CustomerProfileResponse();
        response.setId(customer.getId());
        response.setUsername(customer.getUsername());
        response.setEmail(customer.getEmail());
        response.setPhone(customer.getPhone());
        response.setLoyaltyPoints(customer.getLoyaltyPoints());
        response.setActive(customer.isActive());
        response.setTotalOrders(orders.size());
        response.setTotalSpent(orders.stream()
                .filter(o -> o.getStatus() != SaleStatus.CANCELLED)
                .mapToDouble(Sale::getTotalAmount)
                .sum());
        response.setMemberSince(
                customer.getCreatedAt() != null ? customer.getCreatedAt().toString() : "N/A");

        return response;
    }

    @Override
    @Transactional
    public CustomerProfileResponse updateProfile(Long customerId, UpdateProfileRequest request) {
        User customer = getCustomerOrThrow(customerId);

        // Mettre à jour les champs non null
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            // Vérifier que le username n'est pas déjà pris
            userRepo.findByUsername(request.getUsername())
                    .filter(u -> !u.getId().equals(customerId))
                    .ifPresent(u -> {
                        throw new BadRequestException("Username already taken");
                    });
            customer.setUsername(request.getUsername());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            // Vérifier que l'email n'est pas déjà pris
            userRepo.findByEmail(request.getEmail())
                    .filter(u -> !u.getId().equals(customerId))
                    .ifPresent(u -> {
                        throw new BadRequestException("Email already taken");
                    });
            customer.setEmail(request.getEmail());
        }

        if (request.getPhone() != null) {
            customer.setPhone(request.getPhone());
        }

        userRepo.save(customer);

        return getProfile(customerId);
    }

    @Override
    public LoyaltyInfoResponse getLoyaltyInfo(Long customerId) {
        User customer = getCustomerOrThrow(customerId);
        List<Sale> orders = saleRepo.findByCustomerId(customerId);

        LoyaltyInfoResponse response = new LoyaltyInfoResponse();
        response.setCustomerId(customer.getId());
        response.setCustomerName(customer.getUsername());
        response.setCurrentPoints(customer.getLoyaltyPoints());
        response.setLoyaltyTier(calculateLoyaltyTier(customer.getLoyaltyPoints()));
        response.setPointsToNextTier(calculatePointsToNextTier(customer.getLoyaltyPoints()));
        response.setTotalSpent(orders.stream()
                .filter(o -> o.getStatus() != SaleStatus.CANCELLED)
                .mapToDouble(Sale::getTotalAmount)
                .sum());

        // Historique récent des points (basé sur les commandes)
        List<LoyaltyInfoResponse.PointsHistoryItem> history = new ArrayList<>();
        int runningBalance = customer.getLoyaltyPoints();

        // Prendre les 5 dernières commandes complétées
        List<Sale> recentOrders = orders.stream()
                .filter(o -> o.getStatus() == SaleStatus.COMPLETED || o.getStatus() == SaleStatus.CONFIRMED)
                .sorted((a, b) -> b.getSaleDate().compareTo(a.getSaleDate()))
                .limit(5)
                .toList();

        for (Sale order : recentOrders) {
            LoyaltyInfoResponse.PointsHistoryItem item = new LoyaltyInfoResponse.PointsHistoryItem();
            int pointsEarned = (int) Math.floor(order.getTotalAmount());
            item.setDate(order.getSaleDate().toString());
            item.setDescription("Commande #" + order.getId());
            item.setPointsChange(pointsEarned);
            item.setBalanceAfter(runningBalance);
            runningBalance -= pointsEarned;
            history.add(item);
        }

        response.setRecentActivity(history);

        return response;
    }

    @Override
    public String calculateLoyaltyTier(Integer points) {
        if (points == null)
            return "BRONZE";

        if (points >= 10000)
            return "PLATINUM";
        if (points >= 5000)
            return "GOLD";
        if (points >= 1000)
            return "SILVER";
        return "BRONZE";
    }

    private int calculatePointsToNextTier(Integer points) {
        if (points == null)
            points = 0;

        if (points >= 10000)
            return 0; // Déjà PLATINUM
        if (points >= 5000)
            return 10000 - points;
        if (points >= 1000)
            return 5000 - points;
        return 1000 - points;
    }

    private User getCustomerOrThrow(Long customerId) {
        User user = userRepo.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.ACHETEUR) {
            throw new BadRequestException("User is not a customer (ACHETEUR)");
        }

        if (!user.isActive()) {
            throw new BadRequestException("Account is not active");
        }

        return user;
    }
}
