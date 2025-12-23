package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.sale.SaleRequest;
import com.projetee.sallesmangement.dto.sale.SaleResponse;
import com.projetee.sallesmangement.entity.Role;
import com.projetee.sallesmangement.service.SaleService;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService service;

    @PostMapping
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody SaleRequest request) {
        SaleResponse response = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/sales/" + response.getId()))
                .body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

//    @GetMapping
//    public ResponseEntity<List<SaleResponse>> getAll() {
//        return ResponseEntity.ok(service.getAll());
//    }
    @GetMapping
    public List<SaleResponse> getAll(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role
    ) {
        return service.getAll(userId, role);
    }
    @GetMapping("/page")
    public ResponseEntity<Page<SaleResponse>> getPage(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(service.getPaginated(userId,role,page, size));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<SaleResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(service.cancel(id));
    }
}



//package com.projetee.sallesmangement.controller;
//
//import com.projetee.sallesmangement.dto.sale.SaleRequest;
//import com.projetee.sallesmangement.dto.sale.SaleResponse;
//import com.projetee.sallesmangement.service.SaleService;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import jakarta.validation.Valid;
//import java.util.List;
//
//@RestController
//@RequestMapping("/api/sales")
//@RequiredArgsConstructor
//public class SaleController {
//
//    private final SaleService service;
//
//    @PostMapping
//    public ResponseEntity<SaleResponse> create(@Valid @RequestBody SaleRequest request) {
//        return ResponseEntity.ok(service.create(request));
//    }
//
//    @GetMapping("/{id}")
//    public ResponseEntity<SaleResponse> get(@PathVariable Long id) {
//        return ResponseEntity.ok(service.get(id));
//    }
//
//    @GetMapping
//    public ResponseEntity<List<SaleResponse>> getAll() {
//        return ResponseEntity.ok(service.getAll());
//    }
//
////    @DeleteMapping("/{id}")
////    public ResponseEntity<Void> delete(@PathVariable Long id) {
////        service.delete(id);
////        return ResponseEntity.noContent().build();
////    }
//
//    @DeleteMapping("/{id}")
//    public ResponseEntity<?> delete(@PathVariable Long id) {
//        return ResponseEntity.badRequest()
//                .body("Deleting a sale is not allowed. Use /cancel instead.");
//    }
//    @GetMapping("/paginated")
//    public ResponseEntity<?> getPaginated(
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "10") int size
//    ) {
//        return ResponseEntity.ok(service.getPaginated(page, size));
//    }
//
//    @PostMapping("/{id}/cancel")
//    public ResponseEntity<SaleResponse> cancel(@PathVariable Long id) {
//        return ResponseEntity.ok(service.cancel(id));
//    }
//
//}
