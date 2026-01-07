package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.entity.Product;
import com.projetee.sallesmangement.entity.SearchHistory;
import com.projetee.sallesmangement.entity.User;
import com.projetee.sallesmangement.repository.ProductRepository;
import com.projetee.sallesmangement.repository.SearchHistoryRepository;
import com.projetee.sallesmangement.service.PythonMLClient;
import com.projetee.sallesmangement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final PythonMLClient mlClient;
    private final ProductRepository productRepo;
    private final SearchHistoryRepository historyRepo;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Product>> search(@RequestParam String q) {
        // 1. Sauvegarder l'historique (JEE)
        try {
            User user = userService.getCurrentUser();
            historyRepo.save(SearchHistory.builder()
                    .query(q).user(user).searchDate(LocalDateTime.now()).build());
        } catch (Exception e) {
            // Ignorer si utilisateur non connecté
        }

        // 2. Appel Python pour l'intelligence
        List<Long> ids = mlClient.searchProductIds(q);

        // 3. Récupérer les vrais produits depuis la BDD Java
        if (ids.isEmpty()) {
            return ResponseEntity.ok(productRepo.findByTitleContainingIgnoreCase(q)); // Fallback classique
        }
        return ResponseEntity.ok(productRepo.findAllById(ids));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> suggest(@RequestParam String q) {
        return ResponseEntity.ok(mlClient.getSuggestions(q));
    }
}