package com.projetee.sallesmangement.dto.analytics;

import lombok.Data;

@Data
public class SlowMoverResponse {

    private Long productId;
    private String title;
    private String categoryName;
    private long quantitySold;
}
