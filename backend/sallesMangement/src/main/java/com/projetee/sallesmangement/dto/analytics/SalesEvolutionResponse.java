package com.projetee.sallesmangement.dto.analytics;

import lombok.Data;

@Data
public class SalesEvolutionResponse {

    private double currentMonthRevenue;
    private double previousMonthRevenue;
    private double growthRate;
}
