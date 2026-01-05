package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.product.ProductRequest;
import com.projetee.sallesmangement.dto.product.ProductResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ProductService {

    ProductResponse create(ProductRequest request);

    ProductResponse get(Long id);

    List<ProductResponse> getAll();

    Page<ProductResponse> getPaginated(int page, int size, String sortBy);

    ProductResponse update(Long id, ProductRequest request);

    void delete(Long id);

    List<ProductResponse> search(String query);

    java.util.Map<String, Object> importProducts(org.springframework.web.multipart.MultipartFile file);
}

