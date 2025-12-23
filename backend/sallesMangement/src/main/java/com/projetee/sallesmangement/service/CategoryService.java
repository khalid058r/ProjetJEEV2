package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.category.CategoryRequest;
import com.projetee.sallesmangement.dto.category.CategoryResponse;
import com.projetee.sallesmangement.dto.product.ProductResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface CategoryService {

    CategoryResponse create(CategoryRequest request);
    List<ProductResponse> getProductsByCategory(Long categoryId);


    CategoryResponse get(Long id);

    List<CategoryResponse> getAll();

    Page<CategoryResponse> getPaginated(int page, int size, String sortBy);

    CategoryResponse update(Long id, CategoryRequest request);

    void delete(Long id);
}

