package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des articles de panier.
 */
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    /**
     * Trouve tous les articles d'un panier.
     */
    List<CartItem> findByCartId(Long cartId);

    /**
     * Trouve un article spécifique dans un panier.
     */
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

    /**
     * Vérifie si un produit est déjà dans un panier.
     */
    boolean existsByCartIdAndProductId(Long cartId, Long productId);

    /**
     * Supprime tous les articles d'un panier.
     */
    void deleteByCartId(Long cartId);

    /**
     * Compte le nombre d'articles distincts dans un panier.
     */
    long countByCartId(Long cartId);
}
