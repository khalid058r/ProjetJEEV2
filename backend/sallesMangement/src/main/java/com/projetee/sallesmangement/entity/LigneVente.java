package com.projetee.sallesmangement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneVente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Integer quantity;

    @Column(nullable = false)
    private Double unitPrice;

    @NotNull
    private Double lineTotal;

    @ManyToOne(optional = false)
    private Product product;

    @ManyToOne(optional = false)
    private Sale sale;
}
