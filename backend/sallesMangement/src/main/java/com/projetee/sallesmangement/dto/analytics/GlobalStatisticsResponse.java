package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GlobalStatisticsResponse {
    private PriceStatistics priceStats;
    private RatingStatistics ratingStats;
    private StockStatistics stockStats;
}