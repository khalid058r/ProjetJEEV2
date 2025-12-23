package com.projetee.sallesmangement.mapper;

import com.projetee.sallesmangement.dto.category.CategoryRequest;
import com.projetee.sallesmangement.dto.category.CategoryResponse;
import com.projetee.sallesmangement.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category toEntity(CategoryRequest dto) {
        return Category.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .build();
    }

    public CategoryResponse toResponse(Category entity) {
        CategoryResponse dto = new CategoryResponse();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        return dto;
    }
}

//@Component
//public class CategoryMapper {
//
//    public Category toEntity(CategoryRequest dto) {
//        Category entity = new Category();
//        entity.setName(dto.getName());
//        entity.setDescription(dto.getDescription());
//        return entity;
//    }
//
//    public CategoryResponse toResponse(Category entity) {
//        CategoryResponse dto = new CategoryResponse();
//        dto.setId(entity.getId());
//        dto.setName(entity.getName());
//        dto.setDescription(entity.getDescription());
//        return dto;
//    }
//}
