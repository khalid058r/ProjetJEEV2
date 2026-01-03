package com.projetee.sallesmangement.dto.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO pour la mise à jour du profil client.
 */
@Data
public class UpdateProfileRequest {

    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @Email(message = "Email must be valid")
    private String email;

    @Size(max = 20, message = "Phone number must be at most 20 characters")
    private String phone;
}
