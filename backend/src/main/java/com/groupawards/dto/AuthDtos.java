package com.groupawards.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record TelegramAuthRequest(
            Long id,
            String first_name,
            String last_name,
            String username,
            String photo_url,
            Long auth_date,
            String hash
    ) {
    }

    /** Login without Telegram bot: user enters @username (+ optional display name). */
    public record TelegramLiteRequest(
            @NotBlank @Size(min = 2, max = 64) String username,
            @Size(max = 100) String displayName
    ) {
    }

    public record AdminLoginRequest(
            @NotBlank String login,
            @NotBlank String password
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 6, max = 100) String newPassword,
            @NotBlank @Size(min = 3, max = 50) String newLogin
    ) {
    }

    public record AuthResponse(
            String token,
            UserMeResponse user
    ) {
    }

    public record UserMeResponse(
            Long id,
            String username,
            String firstName,
            String lastName,
            String photoUrl,
            String role,
            boolean mustChangePassword
    ) {
    }
}
