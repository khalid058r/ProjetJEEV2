package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.entity.Category;
import com.projetee.sallesmangement.entity.Product;
import com.projetee.sallesmangement.repository.CategoryRepository;
import com.projetee.sallesmangement.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceImplTest {

    @Mock
    private ProductRepository repo;

    @Mock
    private CategoryRepository categoryRepo;

    @InjectMocks
    private ProductServiceImpl service;

    @Test
    public void importProducts_shouldImportValidCsv() {
        // Given
        String csvContent = "title,price,stock,category\n" +
                "Test Product,100.0,10,Electronics\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        when(categoryRepo.findByNameIgnoreCase("Electronics")).thenReturn(Optional.of(new Category(1L, "Electronics", null, null)));
        when(repo.existsByTitleIgnoreCase("Test Product")).thenReturn(false);

        // When
        Map<String, Object> result = service.importProducts(file);

        // Then
        assertEquals(1, result.get("successCount"));
        assertEquals(0, result.get("failureCount"));
        verify(repo, times(1)).save(any(Product.class));
    }

    @Test
    public void importProducts_shouldHandleDuplicate() {
        // Given
        String csvContent = "title,price,stock,category\n" +
                "Test Product,100.0,10,Electronics\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        when(categoryRepo.findByNameIgnoreCase("Electronics")).thenReturn(Optional.of(new Category(1L, "Electronics", null, null)));
        when(repo.existsByTitleIgnoreCase("Test Product")).thenReturn(true);

        // When
        Map<String, Object> result = service.importProducts(file);

        // Then
        assertEquals(0, result.get("successCount"));
        assertEquals(1, result.get("failureCount"));
        verify(repo, never()).save(any(Product.class));
    }
}
