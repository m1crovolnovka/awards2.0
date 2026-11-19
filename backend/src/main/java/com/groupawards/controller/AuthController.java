package com.groupawards.controller;

import com.groupawards.dto.AuthDtos.*;
import com.groupawards.service.AuthService;
import com.groupawards.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/telegram")
    public AuthResponse telegram(@RequestBody TelegramAuthRequest request) {
        return authService.loginTelegram(request);
    }

    /** Login without Telegram bot — username + display name. */
    @PostMapping("/telegram/lite")
    public AuthResponse telegramLite(@Valid @RequestBody TelegramLiteRequest request) {
        return authService.loginTelegramLite(request);
    }

    @PostMapping("/admin/login")
    public AuthResponse adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        return authService.loginAdmin(request);
    }

    @PostMapping("/admin/change-credentials")
    public AuthResponse changeCredentials(@Valid @RequestBody ChangePasswordRequest request) {
        return authService.changeAdminCredentials(SecurityUtils.currentUserId(), request);
    }

    @GetMapping("/me")
    public UserMeResponse me() {
        return authService.me(SecurityUtils.currentUserId());
    }
}
