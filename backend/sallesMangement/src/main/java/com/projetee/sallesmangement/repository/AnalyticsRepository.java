package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AnalyticsRepository extends JpaRepository<Product, Long> {



    @Query("SELECT COUNT(DISTINCT p.category.id) FROM Product p")
    Long countCategories();

    @Query("SELECT AVG(p.price) FROM Product p")
    Double getAveragePriceGlobal();

    @Query("SELECT AVG(p.rating) FROM Product p WHERE p.rating IS NOT NULL")
    Double getAverageRatingGlobal();


    @Query("SELECT c.name, COUNT(p), AVG(p.price), AVG(p.rating) " +
            "FROM Product p JOIN p.category c " +
            "GROUP BY c.name " +
            "ORDER BY COUNT(p) DESC")
    List<Object[]> getCategoryDistribution();


    @Query("SELECT p FROM Product p " +
            "ORDER BY p.rank ASC")
    List<Product> getTop10Products();

    @Query("SELECT p FROM Product p " +
            "WHERE p.category.id = :categoryId " +
            "ORDER BY p.rank ASC")
    List<Product> getTop10ProductsByCategory(@Param("categoryId") Long categoryId);


    @Query("SELECT AVG(p.price) FROM Product p WHERE p.category.id = :categoryId")
    Double getAveragePriceByCategory(@Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p " +
            "WHERE p.category.id = :categoryId " +
            "ORDER BY p.rating DESC, p.reviewCount DESC")
    List<Product> getBestRatedByCategory(@Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p " +
            "WHERE p.category.id = :categoryId " +
            "ORDER BY p.rank ASC")
    List<Product> getBestSellerByCategory(@Param("categoryId") Long categoryId);

    // Distribution des notes par catégorie
    @Query("SELECT p.rating, COUNT(p) FROM Product p " +
            "WHERE p.category.id = :categoryId AND p.rating IS NOT NULL " +
            "GROUP BY p.rating " +
            "ORDER BY p.rating DESC")
    List<Object[]> getRatingDistributionByCategory(@Param("categoryId") Long categoryId);


    @Query("SELECT p FROM Product p " +
            "WHERE (:categoryId IS NULL OR p.category.id = :categoryId) " +
            "AND p.price BETWEEN :minPrice AND :maxPrice " +
            "ORDER BY " +
            "CASE WHEN :sortBy = 'rank' THEN p.rank END ASC, " +
            "CASE WHEN :sortBy = 'price' THEN p.price END ASC, " +
            "CASE WHEN :sortBy = 'rating' THEN p.rating END DESC, " +
            "CASE WHEN :sortBy = 'reviews' THEN p.reviewCount END DESC")
    List<Product> filterProducts(
            @Param("categoryId") Long categoryId,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("sortBy") String sortBy
    );


    @Query("SELECT p FROM Product p " +
            "WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(p.asin) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Product> searchProducts(@Param("keyword") String keyword);

    @Query("SELECT p FROM Product p " +
            "WHERE p.price <= :maxPrice " +
            "ORDER BY p.rating DESC, p.reviewCount DESC")
    List<Product> findProductsUnderPrice(@Param("maxPrice") Double maxPrice);

    @Query("SELECT p FROM Product p " +
            "WHERE p.reviewCount >= :minReviews " +
            "ORDER BY p.reviewCount DESC")
    List<Product> findProductsWithManyReviews(@Param("minReviews") Integer minReviews);

    @Query("SELECT p FROM Product p " +
            "WHERE p.rating >= 4.0 " +
            "ORDER BY (p.rating * p.reviewCount) / p.price DESC")
    List<Product> findBestValueProducts();


    @Query("SELECT p FROM Product p " +
            "WHERE p.rating >= 4.5 " +
            "AND p.reviewCount >= 100 " +
            "AND p.rank > 100 " +
            "ORDER BY (p.rating * p.reviewCount) DESC")
    List<Product> findPotentialBestSellers();

    // Prix moyen des top 10 par catégorie (pour recommandation prix)
    @Query("SELECT AVG(p.price) FROM Product p " +
            "WHERE p.category.id = :categoryId " +
            "AND p.rank <= 10")
    Double getAveragePriceTop10InCategory(@Param("categoryId") Long categoryId);

    // ============ ALERTES ============

    @Query("SELECT p FROM Product p " +
            "WHERE p.rank <= 10 " +
            "ORDER BY p.rank ASC")
    List<Product> getTop10ForAlerts();

    @Query("SELECT c.name, COUNT(p) FROM Product p " +
            "JOIN p.category c " +
            "WHERE p.rank <= 10 " +
            "GROUP BY c.name " +
            "ORDER BY COUNT(p) DESC")
    List<Object[]> getTop10CategoriesDistribution();


    @Query("SELECT MIN(p.price), MAX(p.price), AVG(p.price) FROM Product p")
    Object[] getPriceStatistics();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.stock <= :threshold")
    Long countLowStock(@Param("threshold") Integer threshold);
}
