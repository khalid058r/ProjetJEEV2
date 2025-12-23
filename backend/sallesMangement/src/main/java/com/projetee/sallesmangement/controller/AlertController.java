package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.alert.AlertResponse;
import com.projetee.sallesmangement.dto.alert.AlertSummary;
import com.projetee.sallesmangement.entity.AlertType;
import com.projetee.sallesmangement.entity.Role;
import com.projetee.sallesmangement.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @PostMapping("/generate")
    public ResponseEntity<Map<String, List<AlertResponse>>> generateAlerts() {
        return ResponseEntity.ok(alertService.generateAllAlerts());
    }

    @PostMapping("/generate/top10")
    public ResponseEntity<List<AlertResponse>> generateTop10Alerts() {
        return ResponseEntity.ok(alertService.detectNewTop10Products());
    }

    @PostMapping("/generate/categories")
    public ResponseEntity<List<AlertResponse>> generateCategoryAlerts() {
        return ResponseEntity.ok(alertService.detectTop10Categories());
    }

    @PostMapping("/generate/stock")
    public ResponseEntity<List<AlertResponse>> generateStockAlerts() {
        return ResponseEntity.ok(alertService.detectLowStock());
    }


    @GetMapping
    public ResponseEntity<List<AlertResponse>> getAllAlerts() {
        return ResponseEntity.ok(alertService.getAllAlerts());
    }

    @GetMapping("/unread")
    public ResponseEntity<List<AlertResponse>> getUnreadAlerts() {
        return ResponseEntity.ok(alertService.getUnreadAlerts());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<AlertResponse>> getAlertsByType(@PathVariable AlertType type) {
        return ResponseEntity.ok(alertService.getAlertsByType(type));
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<AlertResponse>> getAlertsForRole(@PathVariable Role role) {
        return ResponseEntity.ok(alertService.getAlertsForRole(role));
    }

    @GetMapping("/summary")
    public ResponseEntity<AlertSummary> getAlertSummary() {
        return ResponseEntity.ok(alertService.getAlertSummary());
    }


    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        alertService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        alertService.markAllAsRead();
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlert(@PathVariable Long id) {
        alertService.deleteAlert(id);
        return ResponseEntity.noContent().build();
    }


    @DeleteMapping("/old")
    public ResponseEntity<Void> deleteOldAlerts(@RequestParam(defaultValue = "30") int days) {
        alertService.deleteOldAlerts(days);
        return ResponseEntity.ok().build();
    }
}
