package com.projetee.sallesmangement.dto.analytics;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class MonthlySalesResponse {

    private List<MonthRevenue> list;
    private Map<String, Double> map;
    @Data
    public static class MonthRevenue {
        private String month;
        private double revenue;
    }
}
