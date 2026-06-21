package com.bjjflow.backend.auth;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 100) String displayName,
            @NotNull @Min(4) @Max(100) Integer age,
            @NotBlank String beltSlug,
            @Min(0) @Max(6) Integer stripes,
            @DecimalMin("20.0") @DecimalMax("250.0") BigDecimal weightKg,
            @Min(80) @Max(230) Integer heightCm) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    public record BeltDto(String slug, String name, String namePt, String colorHex, Integer stripes) {
    }

    public record UserDto(Long id, String email, String username, String displayName, Integer age,
            BigDecimal weightKg, Integer heightCm, BeltDto belt, boolean admin, boolean pro) {
    }

    public record AuthResponse(String accessToken, String refreshToken, UserDto user, boolean mfaRequired,
            String mfaToken) {

        public static AuthResponse tokens(String accessToken, String refreshToken, UserDto user) {
            return new AuthResponse(accessToken, refreshToken, user, false, null);
        }

        public static AuthResponse mfaChallenge(String mfaToken) {
            return new AuthResponse(null, null, null, true, mfaToken);
        }
    }
}
