package com.projetee.sallesmangement.service.Impl;

import com.projetee.sallesmangement.dto.user.UserRequest;
import com.projetee.sallesmangement.dto.user.UserResponse;
import com.projetee.sallesmangement.entity.User;
import com.projetee.sallesmangement.exception.BadRequestException;
import com.projetee.sallesmangement.exception.DuplicateResourceException;
import com.projetee.sallesmangement.exception.ResourceNotFoundException;
import com.projetee.sallesmangement.mapper.UserMapper;
import com.projetee.sallesmangement.repository.UserRepository;
import com.projetee.sallesmangement.service.UserService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;


import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository repo;
    private final UserMapper mapper;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public UserResponse create(UserRequest request) {

        if (repo.existsByEmailIgnoreCase(request.getEmail())) {
            throw new DuplicateResourceException("Email already in use");
        }

        if (repo.findByUsername(request.getUsername()).isPresent()) {
            throw new DuplicateResourceException("Username already taken");
        }

        User user = mapper.toEntity(request);
        user.setCreatedAt(LocalDateTime.now());
        user.setActive(true);

        User saved = repo.save(user);

        return mapper.toResponse(saved);
    }

    @Override
    public UserResponse get(Long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return mapper.toResponse(user);
    }

    @Override
    public List<UserResponse> getAll() {
        return repo.findAll()
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public Page<UserResponse> getPaginated(int page, int size, String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());

        return repo.findAll(pageable)
                .map(mapper::toResponse);
    }

    @Override
    public UserResponse update(Long id, UserRequest request) {

        User user = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail())
                && repo.existsByEmailIgnoreCase(request.getEmail())) {
            throw new DuplicateResourceException("Email already in use");
        }

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
//        user.setPassword(request.getPassword()); // en clair pour l'instant
        user.setPassword(encoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        return mapper.toResponse(repo.save(user));
    }

    @Override
    public UserResponse activate(Long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setActive(true);
        return mapper.toResponse(repo.save(user));
    }

    @Override
    public UserResponse deactivate(Long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setActive(false);
        return mapper.toResponse(repo.save(user));
    }

    @Override
    public UserResponse updatePassword(Long id, String currentPassword, String newPassword) {
        User user = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));


        if (!encoder.matches(currentPassword, user.getPassword())) {
             throw new BadRequestException("Current password incorrect");
        }

        user.setPassword(encoder.encode(newPassword));
        return mapper.toResponse(repo.save(user));
    }

    @Override
    public void delete(Long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        repo.delete(user);
    }
}
