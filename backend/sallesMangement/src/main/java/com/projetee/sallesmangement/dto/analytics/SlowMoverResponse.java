package com.projetee.sallesmangement.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SlowMoverResponse {
    private Long productId;
    private String title;
    private String categoryName;
    private Long quantitySold;
}