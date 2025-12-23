package com.projetee.sallesmangement.mapper;

import com.projetee.sallesmangement.dto.analytics.*;
import com.projetee.sallesmangement.entity.Category;
import com.projetee.sallesmangement.entity.Product;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
public class AnalyticsMapper {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

    public TopProductResponse toTopProductResponse(Product product, long quantitySold, double revenue) {
        TopProductResponse dto = new TopProductResponse();
        dto.setProductId(product.getId());
        dto.setTitle(product.getTitle());
        dto.setCategoryName(product.getCategory().getName());
        dto.setPrice(product.getPrice());
        dto.setRating(product.getRating() != null ? product.getRating() : 0.0);
        dto.setQuantitySold(quantitySold);
        dto.setRevenue(revenue);
        return dto;
    }

    public CategoryStatsResponse toCategoryStatsResponse(Category category,
                                                         double totalRevenue,
                                                         long totalSold,
                                                         double averagePrice,
                                                         Product bestSeller) {

        CategoryStatsResponse dto = new CategoryStatsResponse();
        dto.setCategoryId(category.getId());
        dto.setCategoryName(category.getName());
        dto.setTotalRevenue(totalRevenue);
        dto.setTotalSold(totalSold);
        dto.setAveragePrice(averagePrice);

        if (bestSeller != null) {
            dto.setBestSellerProductId(bestSeller.getId());
            dto.setBestSellerProductTitle(bestSeller.getTitle());
        }

        return dto;
    }

    public DailySalesResponse toDailySalesResponse(LocalDate date, double revenue, long count) {
        DailySalesResponse dto = new DailySalesResponse();
        dto.setDate(date.format(DATE_FORMAT));
        dto.setRevenue(revenue);
        dto.setSalesCount(count);
        return dto;
    }

    public LowStockResponse toLowStockResponse(Product product) {
        LowStockResponse dto = new LowStockResponse();
        dto.setProductId(product.getId());
        dto.setTitle(product.getTitle());
        dto.setCategoryName(product.getCategory().getName());
        dto.setStock(product.getStock());
        return dto;
    }

    public SlowMoverResponse toSlowMoverResponse(Product product, long quantitySold) {
        SlowMoverResponse dto = new SlowMoverResponse();
        dto.setProductId(product.getId());
        dto.setTitle(product.getTitle());
        dto.setCategoryName(product.getCategory().getName());
        dto.setQuantitySold(quantitySold);
        return dto;
    }
}
