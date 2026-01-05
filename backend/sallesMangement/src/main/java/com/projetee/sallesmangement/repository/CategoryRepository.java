package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.Category;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByNameIgnoreCase(@NotBlank String name);

    Optional<Category> findByNameIgnoreCase(String name);
}
