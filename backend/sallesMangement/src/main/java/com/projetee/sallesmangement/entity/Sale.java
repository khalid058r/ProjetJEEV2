package com.projetee.sallesmangement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private LocalDate saleDate;

    @NotNull
    private Double totalAmount;

    @ManyToOne(optional = false)
    private User user;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL)
    private List<LigneVente> lignesVente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SaleStatus status = SaleStatus.CONFIRMED;
}
