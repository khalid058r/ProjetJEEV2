package com.projetee.sallesmangement.dto.auth;

import com.projetee.sallesmangement.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    private String username;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    private Role role; // ADMIN, VENDEUR, ANALYSTE, ACHETEUR, INVESTISSEUR
}
