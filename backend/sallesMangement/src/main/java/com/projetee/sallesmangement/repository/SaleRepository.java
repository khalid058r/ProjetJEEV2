package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByUserId(Long userId);
    Page<Sale> findByUserId(Long userId, Pageable pageable);
}
