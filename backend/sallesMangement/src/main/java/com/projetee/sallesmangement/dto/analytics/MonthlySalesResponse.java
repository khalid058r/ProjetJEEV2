package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlySalesResponse {
    private List<MonthRevenue> list;
    private Map<String, Double> map;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthRevenue {
        private String month;
        private Double revenue;
    }
}