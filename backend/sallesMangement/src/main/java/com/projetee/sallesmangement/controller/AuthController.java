package com.projetee.sallesmangement.controller;

import com.projetee.sallesmangement.dto.auth.LoginRequest;
import com.projetee.sallesmangement.dto.auth.LoginResponse;
import com.projetee.sallesmangement.dto.auth.RegisterRequest;
import com.projetee.sallesmangement.dto.user.UserRequest;
import com.projetee.sallesmangement.dto.user.UserResponse;
import com.projetee.sallesmangement.entity.User;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.mapper.UserMapper;
import com.projetee.sallesmangement.repository.UserRepository;

import com.projetee.sallesmangement.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;

//@RestController
//@RequestMapping("/api/auth")
//@RequiredArgsConstructor
//public class AuthController {
//
//    private final UserRepository repo;
//    private final UserMapper mapper;
//
//    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
//
//    @PostMapping("/register")
//    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRequest request) {
//
//        if (repo.existsByEmailIgnoreCase(request.getEmail())) {
//            throw new BadRequestException("Email already used");
//        }
//
//        if (repo.findByUsername(request.getUsername()).isPresent()) {
//            throw new BadRequestException("Username already used");
//        }
//
//        User user = new User();
//        user.setUsername(request.getUsername());
//        user.setEmail(request.getEmail());
//        user.setPassword(passwordEncoder.encode(request.getPassword()));
//        user.setRole(request.getRole());
//        user.setActive(false);
//        user.setCreatedAt(LocalDateTime.now());
//
//        User saved = repo.save(user);
//
//        return ResponseEntity.ok(mapper.toResponse(saved));
//    }
//
//    @PostMapping("/login")
//    public ResponseEntity<UserResponse> login(@RequestParam String email,
//                                              @RequestParam String password) {
//
//        User user = repo.findByEmail(email)
//                .orElseThrow(() -> new ResourceNotFoundException("Invalid email or password"));
//
//        if (!passwordEncoder.matches(password, user.getPassword())) {
//            throw new BadRequestException("Invalid email or password");
//        }
//
//        if (!user.isActive()) {
//            throw new BadRequestException("Account not yet validated by admin");
//        }
//
//        return ResponseEntity.ok(mapper.toResponse(user));
//    }
//}

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}

