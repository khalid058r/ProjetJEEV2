package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.user.UserRequest;
import com.projetee.sallesmangement.dto.user.UserResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface UserService {

    UserResponse create(UserRequest request);

    UserResponse get(Long id);

    List<UserResponse> getAll();

    Page<UserResponse> getPaginated(int page, int size, String sortBy);

    UserResponse update(Long id, UserRequest request);

    UserResponse activate(Long id);

    UserResponse deactivate(Long id);

    void delete(Long id);

    UserResponse updatePassword(Long id, String currentPassword, String newPassword);
}
