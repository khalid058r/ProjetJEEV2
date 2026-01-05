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
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    private MovementType type;

    private String reason;

    @Column(nullable = false)
    private LocalDateTime date;

    public enum MovementType {
        IN, OUT, ADJUSTMENT, SALE, RETURN
    }
}
