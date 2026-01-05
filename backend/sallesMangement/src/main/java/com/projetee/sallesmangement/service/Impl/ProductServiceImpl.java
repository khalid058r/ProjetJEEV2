package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.product.ProductRequest;
import com.projetee.sallesmangement.dto.product.ProductResponse;
import com.projetee.sallesmangement.entity.Category;
import com.projetee.sallesmangement.entity.Product;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.exception.DuplicateResourceException;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.mapper.ProductMapper;
import com.projetee.sallesmangement.repository.CategoryRepository;
import com.projetee.sallesmangement.repository.ProductRepository;
import com.projetee.sallesmangement.service.ProductService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository repo;
    private final CategoryRepository categoryRepo;
    private final ProductMapper mapper;

    @Override
    public ProductResponse create(ProductRequest request) {

        // Vérifier catégorie
        Category category = categoryRepo.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        // Vérifier unicité ASIN
        if (repo.existsByAsinIgnoreCase(request.getAsin())) {
            throw new DuplicateResourceException("ASIN already exists");
        }

        // Vérifier unicité titre dans toute la base (tu peux changer à par catégorie si tu veux)
        if (repo.existsByTitleIgnoreCase(request.getTitle())) {
            throw new DuplicateResourceException("Product title already exists");
        }

        // Vérifier prix
        if (request.getPrice() <= 0) {
            throw new BadRequestException("Price must be > 0");
        }

        Product product = mapper.toEntity(request);
        product.setCategory(category);

        Product saved = repo.save(product);

        return mapper.toResponse(saved);
    }

    @Override
    public ProductResponse get(Long id) {
        Product product = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return mapper.toResponse(product);
    }

    @Override
    public List<ProductResponse> getAll() {
        return repo.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public Page<ProductResponse> getPaginated(int page, int size, String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());

        return repo.findAll(pageable)
                .map(mapper::toResponse);
    }

    @Override
    public ProductResponse update(Long id, ProductRequest request) {

        Product product = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Category category = categoryRepo.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        // Vérifier ASIN
        if (!product.getAsin().equalsIgnoreCase(request.getAsin()) &&
                repo.existsByAsinIgnoreCase(request.getAsin())) {
            throw new DuplicateResourceException("ASIN already used");
        }

        // Vérifier titre
        if (!product.getTitle().equalsIgnoreCase(request.getTitle()) &&
                repo.existsByTitleIgnoreCase(request.getTitle())) {
            throw new DuplicateResourceException("Title already used");
        }

        if (request.getPrice() <= 0) {
            throw new BadRequestException("Invalid price");
        }

        product.setAsin(request.getAsin());
        product.setTitle(request.getTitle());
        product.setPrice(request.getPrice());
        product.setRating(request.getRating());
        product.setReviewCount(request.getReviewCount());
        product.setRank(request.getRank());
        product.setCategory(category);

        return mapper.toResponse(repo.save(product));
    }

    @Override
    public void delete(Long id) {
        Product product = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Si produit utilisé dans ventes → empêcher suppression
        if (product.getLignesVente() != null && !product.getLignesVente().isEmpty()) {
            throw new BadRequestException("Cannot delete product used in sales");
        }

        // Si stock positif → bloquer suppression
//        if (product.getStock() > 0) {
//            throw new BadRequestException("Cannot delete product with stock > 0");
//        }

        repo.delete(product);
    }
    @Override
    public List<ProductResponse> search(String query) {
        return repo.findByTitleContainingIgnoreCase(query).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public java.util.Map<String, Object> importProducts(org.springframework.web.multipart.MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        int successCount = 0;
        int failureCount = 0;
        java.util.List<String> errors = new java.util.ArrayList<>();

        try (java.io.Reader reader = new java.io.InputStreamReader(file.getInputStream());
             org.apache.commons.csv.CSVParser csvParser = new org.apache.commons.csv.CSVParser(reader,
                     org.apache.commons.csv.CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {

            for (org.apache.commons.csv.CSVRecord record : csvParser) {
                try {
                    String title = record.get("title");
                    String priceStr = record.get("price");
                    String stockStr = record.get("stock");
                    String categoryName = record.get("category");
                    String imageUrl = record.isMapped("imageUrl") ? record.get("imageUrl") : "https://via.placeholder.com/150";

                    if (title == null || title.isBlank() || priceStr == null || stockStr == null || categoryName == null) {
                        throw new BadRequestException("Missing required fields (title, price, stock, category)");
                    }

                    double price = Double.parseDouble(priceStr);
                    int stock = Integer.parseInt(stockStr);

                    // Find or create category
                    Category category = categoryRepo.findByNameIgnoreCase(categoryName)
                            .orElseGet(() -> categoryRepo.save(Category.builder().name(categoryName).build()));

                    // Check if product exists (by Title for simplicity in import)
                    if (repo.existsByTitleIgnoreCase(title)) {
                        failureCount++;
                        errors.add("Row " + record.getRecordNumber() + ": Product '" + title + "' already exists");
                        continue;
                    }

                    Product product = Product.builder()
                            .title(title)
                            .price(price)
                            .stock(stock)
                            .category(category)
                            .imageUrl(imageUrl)
                            .asin("ASIN-" + System.currentTimeMillis() + "-" + record.getRecordNumber()) // Generate ASIN
                            .build();

                    repo.save(product);
                    successCount++;

                } catch (Exception e) {
                    failureCount++;
                    errors.add("Row " + record.getRecordNumber() + ": " + e.getMessage());
                }
            }

        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage());
        }

        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("successCount", successCount);
        summary.put("failureCount", failureCount);
        summary.put("errors", errors);

        return summary;
    }
}
