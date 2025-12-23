package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private DashboardKPI kpi;
    private List<CategoryDistribution> categoryDistribution;
    private List<TopProductDTO> top10Products;
}