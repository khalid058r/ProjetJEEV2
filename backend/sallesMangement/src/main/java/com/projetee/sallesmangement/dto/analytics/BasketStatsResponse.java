package com.projetee.sallesmangement.dto.analytics;

import lombok.Data;

@Data
public class BasketStatsResponse {

    private double averageBasket;
    private double variance;
    private double standardDeviation;
}
