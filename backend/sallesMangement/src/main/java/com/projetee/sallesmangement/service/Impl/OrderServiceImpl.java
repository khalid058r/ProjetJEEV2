package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.lignevente.LigneVenteResponse;
import com.projetee.sallesmangement.dto.order.*;
import com.projetee.sallesmangement.entity.*;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.repository.*;
import com.projetee.sallesmangement.service.CartService;
import com.projetee.sallesmangement.service.OrderService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implémentation du service de commandes Click & Collect.
 */
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final SaleRepository saleRepo;
    private final UserRepository userRepo;
    private final ProductRepository productRepo;
    private final CartRepository cartRepo;
    private final CartService cartService;

    @Override
    @Transactional
    public OrderResponse createOrder(Long customerId, CreateOrderRequest request) {
        // Vérifier le client
        User customer = getCustomerOrThrow(customerId);

        // Récupérer le panier
        Cart cart = cartRepo.findByCustomerId(customerId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        // Créer la commande
        Sale order = new Sale();
        order.setSaleDate(LocalDate.now());
        order.setCustomer(customer);
        // user sera assigné par le vendeur qui prépare la commande
        order.setSaleType(SaleType.ONLINE);
        order.setStatus(SaleStatus.PENDING_PICKUP);
        order.setPickupCode(generatePickupCode());
        order.setEstimatedPickupTime(LocalDateTime.now().plusHours(2)); // 2h de préparation
        order.setNotes(request.getNotes());
        order.setLignesVente(new ArrayList<>());
        order.setTotalAmount(0.0); // Sera mis à jour après

        double total = 0;

        // Convertir les articles du panier en lignes de vente
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            // Vérifier le stock final
            if (product.getStock() < cartItem.getQuantity()) {
                throw new BadRequestException("Not enough stock for: " + product.getTitle() +
                        ". Available: " + product.getStock());
            }

            // Décrémenter le stock
            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepo.save(product);

            // Créer la ligne de vente
            LigneVente lv = new LigneVente();
            lv.setSale(order);
            lv.setProduct(product);
            lv.setQuantity(cartItem.getQuantity());
            lv.setUnitPrice(cartItem.getUnitPrice());
            lv.setLineTotal(cartItem.getLineTotal());

            order.getLignesVente().add(lv);
            total += lv.getLineTotal();
        }

        order.setTotalAmount(total);

        // Calculer les points de fidélité (1 point par MAD)
        int loyaltyPoints = (int) Math.floor(total);
        customer.setLoyaltyPoints(customer.getLoyaltyPoints() + loyaltyPoints);
        userRepo.save(customer);

        // Sauvegarder la commande
        Sale savedOrder = saleRepo.save(order);

        // Vider le panier
        cartService.clearCart(customerId);

        return mapToResponse(savedOrder, loyaltyPoints);
    }

    @Override
    public OrderResponse getOrder(Long customerId, Long orderId) {
        getCustomerOrThrow(customerId);

        Sale order = saleRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Vérifier que la commande appartient au client
        if (order.getCustomer() == null || !order.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("Order does not belong to this customer");
        }

        return mapToResponse(order, 0);
    }

    @Override
    public OrderHistoryResponse getOrderHistory(Long customerId) {
        User customer = getCustomerOrThrow(customerId);

        List<Sale> orders = saleRepo.findByCustomerId(customerId);

        OrderHistoryResponse response = new OrderHistoryResponse();
        response.setCustomerId(customerId);
        response.setCustomerName(customer.getUsername());
        response.setTotalOrders(orders.size());
        response.setLoyaltyPoints(customer.getLoyaltyPoints());
        response.setTotalSpent(orders.stream()
                .filter(o -> o.getStatus() != SaleStatus.CANCELLED)
                .mapToDouble(Sale::getTotalAmount)
                .sum());

        response.setOrders(orders.stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList()));

        return response;
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long customerId, Long orderId) {
        getCustomerOrThrow(customerId);

        Sale order = saleRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Vérifier que la commande appartient au client
        if (order.getCustomer() == null || !order.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("Order does not belong to this customer");
        }

        // On ne peut annuler que si pas encore récupérée
        if (order.getStatus() == SaleStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel a completed order");
        }
        if (order.getStatus() == SaleStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        // Restaurer le stock
        for (LigneVente lv : order.getLignesVente()) {
            Product p = lv.getProduct();
            p.setStock(p.getStock() + lv.getQuantity());
            productRepo.save(p);
        }

        // Retirer les points de fidélité
        int pointsToRemove = (int) Math.floor(order.getTotalAmount());
        User customer = order.getCustomer();
        customer.setLoyaltyPoints(Math.max(0, customer.getLoyaltyPoints() - pointsToRemove));
        userRepo.save(customer);

        order.setStatus(SaleStatus.CANCELLED);
        saleRepo.save(order);

        return mapToResponse(order, -pointsToRemove);
    }

    @Override
    public OrderResponse getOrderByPickupCode(String pickupCode) {
        Sale order = saleRepo.findByPickupCode(pickupCode)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with this pickup code"));
        return mapToResponse(order, 0);
    }

    // ============ MÉTHODES POUR VENDEURS ============

    @Override
    public List<OrderResponse> getAllOnlineOrders() {
        List<Sale> onlineOrders = saleRepo.findBySaleType(SaleType.ONLINE);
        return onlineOrders.stream()
                .map(o -> mapToResponse(o, 0))
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getPendingOrders() {
        // Récupérer toutes les commandes non complétées et non annulées
        List<Sale> pending = saleRepo.findBySaleTypeAndStatusIn(
                SaleType.ONLINE,
                List.of(SaleStatus.PENDING_PICKUP, SaleStatus.CREATED, SaleStatus.CONFIRMED, SaleStatus.READY_PICKUP));
        return pending.stream()
                .map(o -> mapToResponse(o, 0))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse confirmOrder(Long orderId, Long vendorId) {
        User vendor = getVendorOrThrow(vendorId);
        Sale order = getOnlineOrderOrThrow(orderId);

        if (order.getStatus() != SaleStatus.CREATED && order.getStatus() != SaleStatus.PENDING_PICKUP) {
            throw new BadRequestException("Order cannot be confirmed in current status: " + order.getStatus());
        }

        order.setStatus(SaleStatus.CONFIRMED);
        order.setUser(vendor);
        saleRepo.save(order);

        return mapToResponse(order, 0);
    }

    @Override
    @Transactional
    public OrderResponse processOrder(Long orderId, Long vendorId) {
        User vendor = getVendorOrThrow(vendorId);
        Sale order = getOnlineOrderOrThrow(orderId);

        if (order.getStatus() != SaleStatus.CONFIRMED && order.getStatus() != SaleStatus.CREATED
                && order.getStatus() != SaleStatus.PENDING_PICKUP) {
            throw new BadRequestException("Order cannot be processed in current status: " + order.getStatus());
        }

        order.setStatus(SaleStatus.PENDING_PICKUP);
        order.setUser(vendor);
        saleRepo.save(order);

        return mapToResponse(order, 0);
    }

    @Override
    @Transactional
    public OrderResponse markAsReady(Long orderId, Long vendorId) {
        User vendor = getVendorOrThrow(vendorId);
        Sale order = getOnlineOrderOrThrow(orderId);

        // Permettre de marquer prête depuis plusieurs statuts
        if (order.getStatus() != SaleStatus.PENDING_PICKUP &&
                order.getStatus() != SaleStatus.CONFIRMED &&
                order.getStatus() != SaleStatus.CREATED) {
            throw new BadRequestException("Order cannot be marked as ready in current status: " + order.getStatus());
        }

        order.setStatus(SaleStatus.READY_PICKUP);
        order.setUser(vendor);
        saleRepo.save(order);

        return mapToResponse(order, 0);
    }

    @Override
    @Transactional
    public OrderResponse markAsCompleted(Long orderId, Long vendorId) {
        User vendor = getVendorOrThrow(vendorId);
        Sale order = getOnlineOrderOrThrow(orderId);

        if (order.getStatus() != SaleStatus.READY_PICKUP) {
            throw new BadRequestException("Order is not ready for pickup");
        }

        order.setStatus(SaleStatus.COMPLETED);
        order.setActualPickupTime(LocalDateTime.now());
        saleRepo.save(order);

        return mapToResponse(order, 0);
    }

    @Override
    @Transactional
    public OrderResponse rejectOrder(Long orderId, Long vendorId, String reason) {
        User vendor = getVendorOrThrow(vendorId);
        Sale order = getOnlineOrderOrThrow(orderId);

        if (order.getStatus() == SaleStatus.COMPLETED) {
            throw new BadRequestException("Cannot reject a completed order");
        }
        if (order.getStatus() == SaleStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        // Restaurer le stock
        for (LigneVente lv : order.getLignesVente()) {
            Product p = lv.getProduct();
            p.setStock(p.getStock() + lv.getQuantity());
            productRepo.save(p);
        }

        // Retirer les points de fidélité
        int pointsToRemove = (int) Math.floor(order.getTotalAmount());
        User customer = order.getCustomer();
        if (customer != null) {
            customer.setLoyaltyPoints(Math.max(0, customer.getLoyaltyPoints() - pointsToRemove));
            userRepo.save(customer);
        }

        order.setStatus(SaleStatus.CANCELLED);
        order.setNotes((order.getNotes() != null ? order.getNotes() + " | " : "") + "Rejeté: "
                + (reason != null ? reason : "Sans raison"));
        order.setUser(vendor);
        saleRepo.save(order);

        return mapToResponse(order, -pointsToRemove);
    }

    // ============ MÉTHODES PRIVÉES ============

    private User getVendorOrThrow(Long vendorId) {
        User vendor = userRepo.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

        if (vendor.getRole() != Role.ADMIN && vendor.getRole() != Role.VENDEUR) {
            throw new BadRequestException("Only vendors can manage orders");
        }

        return vendor;
    }

    private Sale getOnlineOrderOrThrow(Long orderId) {
        Sale order = saleRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getSaleType() != SaleType.ONLINE) {
            throw new BadRequestException("This is not an online order");
        }

        return order;
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

    private String generatePickupCode() {
        // Génère un code unique de 8 caractères
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private OrderResponse mapToResponse(Sale order, int loyaltyPointsEarned) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setOrderDate(order.getSaleDate().toString());
        response.setTotalAmount(order.getTotalAmount());
        response.setStatus(order.getStatus().name());
        response.setSaleType(order.getSaleType().name());

        if (order.getCustomer() != null) {
            response.setCustomerId(order.getCustomer().getId());
            response.setCustomerName(order.getCustomer().getUsername());
            response.setCustomerEmail(order.getCustomer().getEmail());
            response.setCustomerPhone(order.getCustomer().getPhone());
        }

        response.setPickupCode(order.getPickupCode());
        response.setEstimatedPickupTime(
                order.getEstimatedPickupTime() != null ? order.getEstimatedPickupTime().toString() : null);
        response.setActualPickupTime(
                order.getActualPickupTime() != null ? order.getActualPickupTime().toString() : null);
        response.setNotes(order.getNotes());
        response.setLoyaltyPointsEarned(loyaltyPointsEarned);

        if (order.getLignesVente() != null) {
            response.setItems(order.getLignesVente().stream()
                    .map(this::mapLigneToResponse)
                    .collect(Collectors.toList()));
        }

        return response;
    }

    private LigneVenteResponse mapLigneToResponse(LigneVente lv) {
        LigneVenteResponse response = new LigneVenteResponse();
        response.setId(lv.getId());
        response.setProductId(lv.getProduct().getId());
        response.setProductTitle(lv.getProduct().getTitle());
        response.setQuantity(lv.getQuantity());
        response.setUnitPrice(lv.getUnitPrice());
        response.setLineTotal(lv.getLineTotal());
        return response;
    }

    private OrderHistoryResponse.OrderSummary mapToSummary(Sale order) {
        OrderHistoryResponse.OrderSummary summary = new OrderHistoryResponse.OrderSummary();
        summary.setId(order.getId());
        summary.setOrderDate(order.getSaleDate().toString());
        summary.setTotalAmount(order.getTotalAmount());
        summary.setStatus(order.getStatus().name());
        summary.setPickupCode(order.getPickupCode());
        summary.setItemCount(order.getLignesVente() != null ? order.getLignesVente().size() : 0);
        return summary;
    }
}
