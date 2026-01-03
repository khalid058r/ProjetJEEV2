package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.auth.LoginRequest;
import com.projetee.sallesmangement.dto.auth.LoginResponse;
import com.projetee.sallesmangement.dto.auth.RegisterRequest;
import com.projetee.sallesmangement.entity.Role;
import com.projetee.sallesmangement.entity.User;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.mapper.UserMapper;
import com.projetee.sallesmangement.repository.UserRepository;
import com.projetee.sallesmangement.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepo;
    private final UserMapper userMapper;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public LoginResponse register(RegisterRequest request) {

        if (userRepo.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BadRequestException("Cet email est déjà utilisé");
        }

        User user = userMapper.toEntity(request);
        user.setPassword(encoder.encode(request.getPassword()));

        // Les clients (ACHETEUR) sont automatiquement actifs
        // Les autres rôles nécessitent une validation admin
        if (user.getRole() == Role.ACHETEUR) {
            user.setActive(true);
        } else {
            user.setActive(false);
        }

        user = userRepo.save(user);
        return userMapper.toLoginResponse(user);
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Email ou mot de passe incorrect"));

        if (!encoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Email ou mot de passe incorrect");
        }

        if (!user.isActive()) {
            throw new BadRequestException("Compte en attente de validation par un administrateur");
        }

        return userMapper.toLoginResponse(user);
    }
}
