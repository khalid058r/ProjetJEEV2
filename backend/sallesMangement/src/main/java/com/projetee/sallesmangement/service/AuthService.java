package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.auth.LoginRequest;
import com.projetee.sallesmangement.dto.auth.LoginResponse;
import com.projetee.sallesmangement.dto.auth.RegisterRequest;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    LoginResponse register(RegisterRequest request);
}
