package com.projetee.sallesmangement.dto.alert;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AlertSummary {
    private long totalAlerts;
    private long unreadAlerts;
    private long highPriorityAlerts;
    private long todayAlerts;
}