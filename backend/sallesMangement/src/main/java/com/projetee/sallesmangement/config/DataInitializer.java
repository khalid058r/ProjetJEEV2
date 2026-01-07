package com.projetee.sallesmangement.config;

import com.projetee.sallesmangement.entity.Role;
import com.projetee.sallesmangement.entity.User;
import com.projetee.sallesmangement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) throws Exception {
        createDemoUser("admin", "admin@test.com", "password123", Role.ADMIN);
        createDemoUser("vendeur", "vendeur@test.com", "password123", Role.VENDEUR);
        createDemoUser("analyste", "analyste@test.com", "password123", Role.ANALYSTE);
        createDemoUser("investisseur", "investisseur@test.com", "password123", Role.INVESTISSEUR);
    }

    private void createDemoUser(String username, String email, String password, Role role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = User.builder()
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .role(role)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .loyaltyPoints(0)
                    .build();
            userRepository.save(user);
            System.out.println("Compte de démonstration créé : " + email);
        }
    }
}
