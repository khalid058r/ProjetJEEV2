package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;


public interface CartRepository extends JpaRepository<Cart, Long> {


    Optional<Cart> findByCustomerId(Long customerId);

    boolean existsByCustomerId(Long customerId);

    void deleteByCustomerId(Long customerId);

    @Query("SELECT COALESCE(SUM(ci.quantity), 0) FROM CartItem ci WHERE ci.cart.customer.id = :customerId")
    Integer countItemsByCustomerId(@Param("customerId") Long customerId);
}
