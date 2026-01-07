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
                     org.apache.commons.csv.CSVFormat.DEFAULT
                             .withFirstRecordAsHeader()
                             .withIgnoreHeaderCase()
                             .withTrim())) {

            for (org.apache.commons.csv.CSVRecord record : csvParser) {
                try {
                    // 1. Récupération intelligente des champs (Gestion des noms de colonnes du CSV Amazon)
                    
                    // TITRE : Cherche 'title', sinon utilise l'ASIN ou une valeur par défaut
                    String title = "Produit sans nom";
                    if (record.isMapped("title")) title = record.get("title");
                    else if (record.isMapped("ASIN")) title = "Produit " + record.get("ASIN");
                    
                    // PRIX : Cherche 'price', nettoie le '$' et ','
                    double price = 0.0;
                    if (record.isMapped("price") || record.isMapped("Price")) {
                        String pStr = record.isMapped("price") ? record.get("price") : record.get("Price");
                        pStr = pStr.replace("$", "").replace(",", ""); // Nettoyage "$39.99" -> "39.99"
                        if (!pStr.isEmpty()) price = Double.parseDouble(pStr);
                    }

                    // STOCK : Cherche 'stock', sinon valeur par défaut (ex: 50)
                    int stock = 50; 
                    if (record.isMapped("stock")) {
                        try {
                            stock = Integer.parseInt(record.get("stock"));
                        } catch (NumberFormatException ignored) {}
                    }

                    // CATÉGORIE
                    final String categoryNameFinal = record.isMapped("category") ? record.get("category") : 
                            (record.isMapped("Category") ? record.get("Category") : "Général");

                    // ASIN
                    String asin = record.isMapped("ASIN") ? record.get("ASIN") : "ASIN-" + System.currentTimeMillis();

                    // RATING & REVIEWS (Optionnel mais présent dans le CSV)
                    double rating = 0.0;
                    if (record.isMapped("Rating")) {
                        try { rating = Double.parseDouble(record.get("Rating")); } catch (Exception e) {}
                    }
                    
                    int reviews = 0;
                    if (record.isMapped("Reviews Count")) {
                        try { 
                            String rStr = record.get("Reviews Count").replace(",", "").replace("\"", "");
                            reviews = Integer.parseInt(rStr); 
                        } catch (Exception e) {}
                    }

                    // 2. Logique Métier
                    
                    // Recherche ou création de la catégorie
                    Category category = categoryRepo.findByNameIgnoreCase(categoryNameFinal)
                            .orElseGet(() -> categoryRepo.save(Category.builder().name(categoryNameFinal).build()));

                    // Vérification doublon
                    if (repo.existsByTitleIgnoreCase(title) || (record.isMapped("ASIN") && repo.existsByAsinIgnoreCase(asin))) {
                        failureCount++;
                        // On continue sans ajouter à la liste d'erreurs pour ne pas spammer si on réimporte le même fichier
                        continue; 
                    }

                    // Création du produit
                    Product product = Product.builder()
                            .title(title)
                            .price(price)
                            .stock(stock)
                            .category(category)
                            .rating(rating)
                            .reviewCount(reviews)
                            .imageUrl("https://via.placeholder.com/150") // Image par défaut
                            .asin(asin)
                            .build();

                    repo.save(product);
                    successCount++;

                } catch (Exception e) {
                    failureCount++;
                    errors.add("Ligne " + record.getRecordNumber() + ": " + e.getMessage());
                }
            }

        } catch (java.io.IOException e) {
            throw new RuntimeException("Échec de l'analyse du fichier CSV : " + e.getMessage());
        }

        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("successCount", successCount);
        summary.put("failureCount", failureCount);
        summary.put("errors", errors);

        return summary;
    }
}
