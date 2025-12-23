package com.projetee.sallesmangement.dto.auth;

import com.projetee.sallesmangement.entity.Role;
import lombok.Data;

@Data
public class LoginResponse {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private boolean active;
}
