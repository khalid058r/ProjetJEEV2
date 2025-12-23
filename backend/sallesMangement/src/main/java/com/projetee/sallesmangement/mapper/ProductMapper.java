package com.projetee.sallesmangement.mapper;

import com.projetee.sallesmangement.dto.product.ProductRequest;
import com.projetee.sallesmangement.dto.product.ProductResponse;
import com.projetee.sallesmangement.entity.Product;
import com.projetee.sallesmangement.entity.Category;
import com.projetee.sallesmangement.repository.CategoryRepository;
import org.springframework.stereotype.Component;

//@Component
//public class ProductMapper {
//
//    private final CategoryRepository categoryRepository;
//
//    public ProductMapper(CategoryRepository categoryRepository) {
//        this.categoryRepository = categoryRepository;
//    }
//
//    public Product toEntity(ProductRequest dto) {
//        Product entity = new Product();
//
//        entity.setAsin(dto.getAsin());
//        entity.setTitle(dto.getTitle());
//        entity.setPrice(dto.getPrice());
//        entity.setRating(dto.getRating());
//        entity.setReviewCount(dto.getReviewCount());
//        entity.setRank(dto.getRank());
//
//        Category category = categoryRepository.findById(dto.getCategoryId())
//                .orElseThrow(() -> new RuntimeException("Category not found"));
//        entity.setCategory(category);
//
//        return entity;
//    }
//
//    public ProductResponse toResponse(Product entity) {
//        ProductResponse dto = new ProductResponse();
//
//        dto.setId(entity.getId());
//        dto.setAsin(entity.getAsin());
//        dto.setTitle(entity.getTitle());
//        dto.setPrice(entity.getPrice());
//        dto.setRating(entity.getRating());
//        dto.setReviewCount(entity.getReviewCount());
//        dto.setRank(entity.getRank());
//
//        dto.setCategoryId(entity.getCategory().getId());
//        dto.setCategoryName(entity.getCategory().getName());
//
//        return dto;
//    }
//}
@Component
public class ProductMapper {

    public Product toEntity(ProductRequest dto) {
        return Product.builder()
                .asin(dto.getAsin())
                .title(dto.getTitle())
                .price(dto.getPrice())
                .rating(dto.getRating())
                .reviewCount(dto.getReviewCount())
                .rank(dto.getRank())
                .stock(dto.getStock())
                .imageUrl(dto.getImageUrl())
                .build();
    }

    public ProductResponse toResponse(Product entity) {
        ProductResponse dto = new ProductResponse();

        dto.setId(entity.getId());
        dto.setAsin(entity.getAsin());
        dto.setTitle(entity.getTitle());
        dto.setPrice(entity.getPrice());
        dto.setRating(entity.getRating());
        dto.setReviewCount(entity.getReviewCount());
        dto.setRank(entity.getRank());
        dto.setStock(entity.getStock());
        dto.setImageUrl(entity.getImageUrl());

        dto.setCategoryId(entity.getCategory().getId());
        dto.setCategoryName(entity.getCategory().getName());

        return dto;
    }
}
