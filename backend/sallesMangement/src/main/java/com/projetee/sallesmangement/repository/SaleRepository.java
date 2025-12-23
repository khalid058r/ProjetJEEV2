package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.Sale;
import com.projetee.sallesmangement.entity.SaleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByUserId(Long userId);
    Page<Sale> findByUserId(Long userId, Pageable pageable);

    List<Sale> findByStatus(SaleStatus status);

    List<Sale> findByStatusAndUserId(SaleStatus status, Long userId);

//    @Query("SELECT s FROM Sale s WHERE s.status = :status AND s.saleDate BETWEEN :start AND :end")
//    List<Sale> findByStatusAndDateBetween(SaleStatus status, LocalDate start, LocalDate end);

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
            @Param("end") LocalDate end
    );
}