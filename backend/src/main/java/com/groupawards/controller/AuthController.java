package com.groupawards.controller;

import com.groupawards.dto.AuthDtos.*;
import com.groupawards.service.AuthService;
import com.groupawards.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/telegram")
    public AuthResponse telegram(@RequestBody Map<String, Object> body) {
        return authService.loginTelegram(toTelegramRequest(body));
    }

    @PostMapping("/telegram/lite")
    public AuthResponse telegramLite(@Valid @RequestBody TelegramLiteRequest request) {
        return authService.loginTelegramLite(request);
    }

    @PostMapping("/telegram/webapp")
    public AuthResponse telegramWebApp(@Valid @RequestBody TelegramWebAppRequest request) {
        return authService.loginTelegramWebApp(request);
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

    private static TelegramAuthRequest toTelegramRequest(Map<String, Object> body) {
        return new TelegramAuthRequest(
                asLong(body.get("id")),
                asString(body.get("first_name")),
                asString(body.get("last_name")),
                asString(body.get("username")),
                asString(body.get("photo_url")),
                asLong(body.get("auth_date")),
                asString(body.get("hash"))
        );
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static Long asLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        String s = String.valueOf(value).trim();
        if (s.isEmpty()) {
            return null;
        }
        return Long.valueOf(s);
    }
}
