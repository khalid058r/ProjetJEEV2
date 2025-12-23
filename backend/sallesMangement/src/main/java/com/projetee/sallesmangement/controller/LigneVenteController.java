package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.lignevente.LigneVenteRequest;
import com.projetee.sallesmangement.dto.lignevente.LigneVenteResponse;
import com.projetee.sallesmangement.service.LigneVenteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ligne-ventes")
@RequiredArgsConstructor
public class LigneVenteController {

    private final LigneVenteService service;

    @PostMapping("/{saleId}")
    public ResponseEntity<LigneVenteResponse> addLine(
            @PathVariable Long saleId,
            @Valid @RequestBody LigneVenteRequest request
    ) {
        return ResponseEntity.ok(service.addLine(saleId, request));
    }

    @PutMapping("/{lineId}")
    public ResponseEntity<LigneVenteResponse> updateLine(
            @PathVariable Long lineId,
            @Valid @RequestBody LigneVenteRequest request
    ) {
        return ResponseEntity.ok(service.updateLine(lineId, request));
    }

    @DeleteMapping("/{lineId}")
    public ResponseEntity<Void> deleteLine(@PathVariable Long lineId) {
        service.deleteLine(lineId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{lineId}")
    public ResponseEntity<LigneVenteResponse> getLine(@PathVariable Long lineId) {
        return ResponseEntity.ok(service.get(lineId));
    }

    @GetMapping
    public ResponseEntity<Page<LigneVenteResponse>> getPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(service.getPaginated(page, size));
    }
}
