package com.projetee.sallesmangement.dto.alert;

import com.projetee.sallesmangement.entity.AlertPriority;
import com.projetee.sallesmangement.entity.AlertType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertResponse {
    private Long id;
    private AlertType type;
    private String title;
    private String message;
    private AlertPriority priority;
    private String createdAt;
    private boolean isRead;

    // Données liées
    private Long productId;
    private String productTitle;
    private Long categoryId;
    private String categoryName;

    // Métadonnées
    private String metadata;
}