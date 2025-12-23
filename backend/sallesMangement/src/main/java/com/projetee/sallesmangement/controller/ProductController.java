package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.product.ProductRequest;
import com.projetee.sallesmangement.dto.product.ProductResponse;
import com.projetee.sallesmangement.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService service;

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/products/" + response.getId()))
                .body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/page")
    public ResponseEntity<Page<ProductResponse>> getPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "title") String sortBy
    ) {
        return ResponseEntity.ok(service.getPaginated(page, size, sortBy));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}



//package com.projetee.sallesmangement.controller;
//
//import com.projetee.sallesmangement.dto.product.ProductRequest;
//import com.projetee.sallesmangement.dto.product.ProductResponse;
//import com.projetee.sallesmangement.service.ProductService;
//
//import jakarta.validation.Valid;
//import lombok.RequiredArgsConstructor;
//
//import org.springframework.data.domain.Page;
//import org.springframework.http.HttpStatus;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api/products")
//@RequiredArgsConstructor
//public class ProductController {
//
//    private final ProductService service;
//
//    @PostMapping
//    @ResponseStatus(HttpStatus.CREATED)
//    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
//        return service.create(request);
//    }
//
//    @GetMapping("/{id}")
//    public ProductResponse get(@PathVariable Long id) {
//        return service.get(id);
//    }
//
//    @GetMapping
//    public Page<ProductResponse> getAll(
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "10") int size,
//            @RequestParam(defaultValue = "title") String sortBy
//    ) {
//        return service.getAllPaginated(page, size, sortBy);
//    }
//
//    @PutMapping("/{id}")
//    public ProductResponse update(@PathVariable Long id,
//                                  @Valid @RequestBody ProductRequest request) {
//        return service.update(id, request);
//    }
//
//    @DeleteMapping("/{id}")
//    @ResponseStatus(HttpStatus.NO_CONTENT)
//    public void delete(@PathVariable Long id) {
//        service.delete(id);
//    }
//}
