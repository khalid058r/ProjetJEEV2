package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductAssociation {
    private String product1;
    private String product2;
    private int frequency;
    private double confidence; // Support relative to sales count or just percentage
}
