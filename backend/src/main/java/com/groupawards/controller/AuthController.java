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

    /** Local demo login when TELEGRAM_BOT_TOKEN is not configured. */
    @PostMapping("/telegram/dev")
    public AuthResponse telegramDev(@RequestParam(defaultValue = "Demo User") String name) {
        long fakeId = 100000L + Math.abs(name.hashCode() % 1_000_000);
        return authService.loginTelegram(new TelegramAuthRequest(
                fakeId,
                name,
                null,
                name.replace(' ', '_').toLowerCase(),
                null,
                java.time.Instant.now().getEpochSecond(),
                "dev"
        ));
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
