package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.category.CategoryRequest;
import com.projetee.sallesmangement.dto.category.CategoryResponse;
import com.projetee.sallesmangement.dto.product.ProductResponse;
import com.projetee.sallesmangement.entity.Category;
import com.projetee.sallesmangement.entity.Product;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.exception.DuplicateResourceException;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.mapper.CategoryMapper;
import com.projetee.sallesmangement.mapper.ProductMapper;
import com.projetee.sallesmangement.repository.CategoryRepository;
import com.projetee.sallesmangement.repository.ProductRepository;
import com.projetee.sallesmangement.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository repo;
    private final CategoryMapper mapper;
    private final ProductRepository productRepo;
    private final ProductMapper productMapper;

    @Override
    public CategoryResponse create(CategoryRequest request) {

        // Unicité du nom
        if (repo.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("Category already exists");
        }

        Category saved = repo.save(mapper.toEntity(request));
        return mapper.toResponse(saved);
    }

    @Override
    public CategoryResponse get(Long id) {
        Category category = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        return mapper.toResponse(category);
    }

    @Override
    public List<CategoryResponse> getAll() {
        return repo.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public Page<CategoryResponse> getPaginated(int page, int size, String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());

        return repo.findAll(pageable)
                .map(mapper::toResponse);
    }

    @Override
    public CategoryResponse update(Long id, CategoryRequest request) {

        Category category = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        // Si le nom change, vérifier unicité
        if (!category.getName().equalsIgnoreCase(request.getName())
                && repo.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("Category name already used");
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        Category saved = repo.save(category);
        return mapper.toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        Category category = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        // Empêcher suppression si des produits sont rattachés
        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            throw new BadRequestException("Cannot delete category that contains products");
        }

        repo.delete(category);
    }
    @Override
    public List<ProductResponse> getProductsByCategory(Long categoryId) {

        Category category = repo.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        List<Product> products = productRepo.findByCategoryId(categoryId);

        return products.stream()
                .map(productMapper::toResponse)
                .toList();
    }

}
