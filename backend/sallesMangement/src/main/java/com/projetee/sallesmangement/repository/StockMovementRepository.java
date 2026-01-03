package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByProductIdOrderByDateDesc(Long productId);
    List<StockMovement> findAllByOrderByDateDesc();
}
