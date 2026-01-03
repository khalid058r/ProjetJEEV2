package com.projetee.sallesmangement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Cart cart;

    /**
     * Produit ajouté au panier.
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Product product;

    /**
     * Quantité demandée.
     */
    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer quantity;

    /**
     * Prix unitaire au moment de l'ajout au panier.
     * Conservé pour éviter les changements de prix pendant le shopping.
     */
    @NotNull
    @Column(nullable = false)
    private Double unitPrice;

    /**
     * Calcule le total de cette ligne (prix * quantité).
     */
    public Double getLineTotal() {
        if (unitPrice == null || quantity == null) {
            return 0.0;
        }
        return unitPrice * quantity;
    }
}
