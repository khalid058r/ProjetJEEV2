package com.projetee.sallesmangement.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SearchHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String query; // Le texte cherché (ex: "PC Gamer")
    private LocalDateTime searchDate;

    @ManyToOne
    private User user; // L'utilisateur qui a cherché
}