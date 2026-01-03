package com.projetee.sallesmangement.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String asin;

    @NotBlank
    private String title;

    @NotNull
    private Double price;

    private Double rating;

    private Integer reviewCount;

    private Integer rank;
    @Column(name = "image_url")
    private String imageUrl;

    @ManyToOne(optional = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Category category;

    @NotNull
    @Builder.Default
    private Integer stock = 0;

    @OneToMany(mappedBy = "product")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<LigneVente> lignesVente;

}
