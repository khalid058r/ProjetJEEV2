package com.projetee.sallesmangement.dto.analytics;

import lombok.Data;

@Data
public class DailySalesResponse {

    private String date;
    private double revenue;
    private long salesCount;
}
