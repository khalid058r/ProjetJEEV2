package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.Alert;
import com.projetee.sallesmangement.entity.AlertPriority;
import com.projetee.sallesmangement.entity.AlertType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByIsReadFalseOrderByCreatedAtDesc();

    // Alertes récentes (7 derniers jours)
    @Query("SELECT a FROM Alert a WHERE a.createdAt >= :date ORDER BY a.createdAt DESC")
    List<Alert> findRecentAlerts(@Param("date") LocalDateTime date);

    List<Alert> findByTypeOrderByCreatedAtDesc(AlertType type);

    List<Alert> findByPriorityOrderByCreatedAtDesc(AlertPriority priority);

    long countByIsReadFalse();

    @Query("SELECT COUNT(a) > 0 FROM Alert a WHERE a.type = :type AND a.product.id = :productId AND a.createdAt >= :since")
    boolean existsRecentAlert(@Param("type") AlertType type,
                              @Param("productId") Long productId,
                              @Param("since") LocalDateTime since);
}