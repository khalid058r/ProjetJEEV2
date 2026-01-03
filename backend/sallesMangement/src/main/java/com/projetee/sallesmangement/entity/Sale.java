package com.projetee.sallesmangement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
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

    @ManyToOne
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<LigneVente> lignesVente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SaleStatus status = SaleStatus.CONFIRMED;

    // ============ NOUVEAUX CHAMPS POUR CLICK & COLLECT ==========
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SaleType saleType = SaleType.IN_STORE;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User customer;

    @Column(length = 20)
    private String pickupCode;

    private LocalDateTime estimatedPickupTime;

    private LocalDateTime actualPickupTime;

    @Column(length = 500)
    private String notes;
}
