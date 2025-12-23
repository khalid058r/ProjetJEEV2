package com.projetee.sallesmangement.mapper;

import com.projetee.sallesmangement.dto.auth.LoginResponse;
import com.projetee.sallesmangement.dto.auth.RegisterRequest;
import com.projetee.sallesmangement.dto.user.UserRequest;
import com.projetee.sallesmangement.dto.user.UserResponse;
import com.projetee.sallesmangement.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(UserRequest dto) {
        return User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .password(dto.getPassword())
                .role(dto.getRole())
                .active(true)
                .build();
    }

    public UserResponse toResponse(User user) {
        UserResponse dto = new UserResponse();

        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setActive(user.isActive());

        return dto;
    }
    public User toEntity(RegisterRequest dto) {
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword()); // sans encodage pour version simple
        user.setRole(dto.getRole());
        user.setActive(true);
        return user;
    }

    public LoginResponse toLoginResponse(User user) {
        LoginResponse dto = new LoginResponse();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setActive(user.isActive());
//        dto.setToken(token);
        return dto;
    }

}
