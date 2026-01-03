package com.projetee.sallesmangement.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity; // Positive for ADD, Negative for REMOVE/ADJUST if relative

    @Enumerated(EnumType.STRING)
    private MovementType type; // IN, OUT, ADJUSTMENT

    private String reason;

    @Column(nullable = false)
    private LocalDateTime date;

    // Enum interne ou externe, ici interne pour simplicité
    public enum MovementType {
        IN, OUT, ADJUSTMENT, SALE, RETURN
    }
}
