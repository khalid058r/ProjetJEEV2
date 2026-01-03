package com.projetee.sallesmangement.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entité User - Représente tous les utilisateurs du système.
 * 
 * Rôles supportés:
 * - ADMIN: Administrateur système
 * - VENDEUR: Vendeur en magasin
 * - ANALYSTE: Accès aux analytics
 * - ACHETEUR: Client e-commerce (Click & Collect)
 * - INVESTISSEUR: Accès lecture aux KPIs
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String username;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Builder.Default
    private boolean active = true;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Sale> sales;

    @Column(nullable = false)
    @Builder.Default
    private Integer loyaltyPoints = 0;

    @Column(length = 20)
    private String phone;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Sale> orders;

    @OneToOne(mappedBy = "customer", cascade = CascadeType.ALL)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Cart cart;
}
