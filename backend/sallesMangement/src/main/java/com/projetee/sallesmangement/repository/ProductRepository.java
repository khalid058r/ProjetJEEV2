package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.Product;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategoryId(Long categoryId);

    List<Product> findByTitleContainingIgnoreCase(String title);

    boolean existsByTitleIgnoreCase(@NotBlank String title);

    boolean existsByTitleIgnoreCaseAndCategoryId(@NotBlank String title, @NotNull Long categoryId);

    boolean existsByAsinIgnoreCase(@NotBlank String asin);

    @Query("SELECT COUNT(DISTINCT p.category.id) FROM Product p")
    Long countDistinctCategories();

    @Query("SELECT AVG(p.price) FROM Product p")
    Double getAveragePriceGlobal();

    @Query("SELECT AVG(p.rating) FROM Product p WHERE p.rating IS NOT NULL")
    Double getAverageRatingGlobal();

    @Query("SELECT MIN(p.price), MAX(p.price), AVG(p.price) FROM Product p")
    Object[] getPriceStatistics();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.rating IS NOT NULL")
    Long countProductsWithRating();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.stock <= :threshold")
    Long countLowStock(@Param("threshold") Integer threshold);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.stock = 0")
    Long countOutOfStock();
    @Query("SELECT c.name, COUNT(p), AVG(p.price), " +
            "AVG(CASE WHEN p.rating IS NOT NULL THEN p.rating ELSE 0 END) " +
            "FROM Product p JOIN p.category c " +
            "GROUP BY c.name " +
            "ORDER BY COUNT(p) DESC")
    List<Object[]> getCategoryDistribution();

    @Query("SELECT p FROM Product p ORDER BY p.rank ASC")
    List<Product> findAllOrderByRankAsc();

    @Query("SELECT p FROM Product p " +
            "WHERE p.category.id = :categoryId " +
            "ORDER BY p.rank ASC")
    List<Product> findByCategoryIdOrderByRankAsc(@Param("categoryId") Long categoryId);


    @Query("SELECT AVG(p.price) FROM Product p WHERE p.category.id = :categoryId")
    Double getAveragePriceByCategory(@Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p " +
            "WHERE p.category.id = :categoryId " +
            "AND p.rating IS NOT NULL " +
            "ORDER BY p.rating DESC, p.reviewCount DESC")
    List<Product> findBestRatedByCategory(@Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p " +
            "WHERE p.category.id = :categoryId " +
            "ORDER BY p.rank ASC")
    List<Product> findBestSellerByCategory(@Param("categoryId") Long categoryId);

    @Query("SELECT p.rating, COUNT(p) FROM Product p " +
            "WHERE p.category.id = :categoryId " +
            "AND p.rating IS NOT NULL " +
            "GROUP BY p.rating " +
            "ORDER BY p.rating DESC")
    List<Object[]> getRatingDistributionByCategory(@Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p " +
            "WHERE (:categoryId IS NULL OR p.category.id = :categoryId) " +
            "AND p.price BETWEEN :minPrice AND :maxPrice " +
            "ORDER BY " +
            "CASE WHEN :sortBy = 'rank' THEN p.rank END ASC, " +
            "CASE WHEN :sortBy = 'price_asc' THEN p.price END ASC, " +
            "CASE WHEN :sortBy = 'price_desc' THEN p.price END DESC, " +
            "CASE WHEN :sortBy = 'rating' THEN p.rating END DESC, " +
            "CASE WHEN :sortBy = 'reviews' THEN p.reviewCount END DESC")
    List<Product> filterProducts(
            @Param("categoryId") Long categoryId,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("sortBy") String sortBy
    );



}
