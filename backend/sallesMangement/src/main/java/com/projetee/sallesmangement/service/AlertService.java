package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.alert.AlertResponse;
import com.projetee.sallesmangement.dto.alert.AlertSummary;
import com.projetee.sallesmangement.entity.AlertType;
import com.projetee.sallesmangement.entity.Role;

import java.util.List;
import java.util.Map;

public interface AlertService {

    // Génération alertes
    List<AlertResponse> detectNewTop10Products();
    List<AlertResponse> detectTop10Categories();
    List<AlertResponse> detectLowStock();
    List<AlertResponse> detectPriceDrops();
    Map<String, List<AlertResponse>> generateAllAlerts();

    // Récupération alertes
    List<AlertResponse> getAllAlerts();
    List<AlertResponse> getUnreadAlerts();
    List<AlertResponse> getAlertsByType(AlertType type);
    List<AlertResponse> getAlertsForRole(Role role);
    AlertSummary getAlertSummary();

    // Actions
    void markAsRead(Long alertId);
    void markAllAsRead();
    void deleteAlert(Long alertId);
    void deleteOldAlerts(int daysOld);
}