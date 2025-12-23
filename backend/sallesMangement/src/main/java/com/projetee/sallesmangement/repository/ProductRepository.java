package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.Product;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategoryId(Long categoryId);

    boolean existsByTitleIgnoreCase(@NotBlank String title);

    boolean existsByTitleIgnoreCaseAndCategoryId(@NotBlank String title, @NotNull Long categoryId);

    boolean existsByAsinIgnoreCase(@NotBlank String asin);
}
