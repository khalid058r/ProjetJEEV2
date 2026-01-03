package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Repository pour la gestion des paniers clients.
 */
public interface CartRepository extends JpaRepository<Cart, Long> {

    /**
     * Trouve le panier d'un client par son ID.
     */
    Optional<Cart> findByCustomerId(Long customerId);

    /**
     * Vérifie si un client a déjà un panier.
     */
    boolean existsByCustomerId(Long customerId);

    /**
     * Supprime le panier d'un client.
     */
    void deleteByCustomerId(Long customerId);

    /**
     * Compte le nombre d'articles dans le panier d'un client.
     */
    @Query("SELECT COALESCE(SUM(ci.quantity), 0) FROM CartItem ci WHERE ci.cart.customer.id = :customerId")
    Integer countItemsByCustomerId(@Param("customerId") Long customerId);
}
