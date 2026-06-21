package com.bjjflow.backend.auth;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bjjflow.backend.auth.AuthDtos.AuthResponse;
import com.bjjflow.backend.auth.AuthDtos.LoginRequest;
import com.bjjflow.backend.auth.AuthDtos.RefreshRequest;
import com.bjjflow.backend.auth.AuthDtos.RegisterRequest;
import com.bjjflow.backend.auth.MfaDtos.MfaChallengeRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/mfa")
    public AuthResponse completeMfa(@Valid @RequestBody MfaChallengeRequest request) {
        return authService.completeMfa(request.mfaToken(), request.code());
    }
}
