package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.Role;
import com.projetee.sallesmangement.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmailIgnoreCase(@Email @NotBlank String email);

    List<User> findByRole(Role role);
}
