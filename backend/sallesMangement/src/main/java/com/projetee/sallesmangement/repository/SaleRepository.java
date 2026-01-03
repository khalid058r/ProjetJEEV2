package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.Sale;
import com.projetee.sallesmangement.entity.SaleStatus;
import com.projetee.sallesmangement.entity.SaleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    // ============ MÉTHODES EXISTANTES (NE PAS MODIFIER) ============

    List<Sale> findByUserId(Long userId);

    Page<Sale> findByUserId(Long userId, Pageable pageable);

    List<Sale> findByStatus(SaleStatus status);

    List<Sale> findByStatusAndUserId(SaleStatus status, Long userId);

    @Query("SELECT SUM(s.totalAmount) FROM Sale s WHERE s.status = 'CONFIRMED'")
    Double getTotalRevenue();

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.status = 'CONFIRMED'")
    Long getTotalSalesCount();

    @Query("SELECT s FROM Sale s " +
            "WHERE s.status = :status " +
            "AND s.saleDate BETWEEN :start AND :end")
    List<Sale> findByStatusAndDateBetween(
            @Param("status") SaleStatus status,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    // ============ NOUVELLES MÉTHODES POUR CLICK & COLLECT ============

    /**
     * Trouve les commandes d'un client (ONLINE).
     */
    List<Sale> findByCustomerId(Long customerId);

    Page<Sale> findByCustomerId(Long customerId, Pageable pageable);

    /**
     * Trouve les commandes par type (IN_STORE ou ONLINE).
     */
    List<Sale> findBySaleType(SaleType saleType);

    Page<Sale> findBySaleType(SaleType saleType, Pageable pageable);

    /**
     * Trouve les commandes en attente de préparation (pour vendeurs).
     */
    List<Sale> findBySaleTypeAndStatus(SaleType saleType, SaleStatus status);

    /**
     * Trouve les commandes par type et statuts multiples.
     */
    List<Sale> findBySaleTypeAndStatusIn(SaleType saleType, List<SaleStatus> statuses);

    /**
     * Trouve une commande par son code de retrait.
     */
    @Query("SELECT s FROM Sale s WHERE s.pickupCode = :pickupCode")
    java.util.Optional<Sale> findByPickupCode(@Param("pickupCode") String pickupCode);

    /**
     * Compte les commandes en attente de préparation.
     */
    @Query("SELECT COUNT(s) FROM Sale s WHERE s.saleType = 'ONLINE' AND s.status = 'PENDING_PICKUP'")
    Long countPendingPickupOrders();

    /**
     * Compte les commandes prêtes à récupérer.
     */
    @Query("SELECT COUNT(s) FROM Sale s WHERE s.saleType = 'ONLINE' AND s.status = 'READY_PICKUP'")
    Long countReadyPickupOrders();

    /**
     * Revenue des commandes en ligne.
     */
    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.saleType = 'ONLINE' AND s.status IN ('CONFIRMED', 'COMPLETED')")
    Double getOnlineRevenue();

    /**
     * Revenue des ventes en magasin.
     */
    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.saleType = 'IN_STORE' AND s.status = 'CONFIRMED'")
    Double getInStoreRevenue();
}