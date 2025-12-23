package com.projetee.sallesmangement.dto.user;

import com.projetee.sallesmangement.entity.Role;
import lombok.Data;

@Data
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private Role role;
    private boolean active;
}
