package com.groupawards.service;

import com.groupawards.dto.AuthDtos.*;
import com.groupawards.entity.AppUser;
import com.groupawards.entity.Role;
import com.groupawards.repository.AppUserRepository;
import com.groupawards.security.JwtService;
import com.groupawards.util.ApiException;
import com.groupawards.util.TelegramAuthValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TelegramAuthValidator telegramAuthValidator;

    @Transactional
    public AuthResponse loginTelegram(TelegramAuthRequest request) {
        if (!telegramAuthValidator.isValid(request)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Telegram authentication data");
        }

        AppUser user = userRepository.findByTelegramId(request.id())
                .orElseGet(() -> AppUser.builder()
                        .telegramId(request.id())
                        .role(Role.USER)
                        .mustChangePassword(false)
                        .build());

        user.setFirstName(request.first_name());
        user.setLastName(request.last_name());
        user.setUsername(request.username());
        user.setPhotoUrl(request.photo_url());
        user = userRepository.save(user);

        return new AuthResponse(jwtService.generateToken(user), toMe(user));
    }

    /**
     * Bot-free login for group voting: identity is stable by Telegram @username.
     * Not cryptographically verified by Telegram — enable only when bot is not configured
     * or when TELEGRAM_LITE_AUTH=true.
     */
    @Transactional
    public AuthResponse loginTelegramLite(TelegramLiteRequest request) {
        if (!telegramAuthValidator.isLiteAllowed()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Lite Telegram login is disabled");
        }

        String username = normalizeUsername(request.username());
        if (username.length() < 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid Telegram username");
        }

        long syntheticId = syntheticTelegramId(username);
        AppUser user = userRepository.findByTelegramId(syntheticId)
                .orElseGet(() -> AppUser.builder()
                        .telegramId(syntheticId)
                        .role(Role.USER)
                        .mustChangePassword(false)
                        .build());

        user.setUsername(username);
        user.setFirstName(request.displayName().trim());
        user.setLastName(null);
        user = userRepository.save(user);

        return new AuthResponse(jwtService.generateToken(user), toMe(user));
    }

    private static String normalizeUsername(String raw) {
        String u = raw == null ? "" : raw.trim();
        if (u.startsWith("@")) {
            u = u.substring(1);
        }
        return u.toLowerCase().replaceAll("[^a-z0-9_]", "");
    }

    private static long syntheticTelegramId(String username) {
        // Stable positive id in a range that won't collide with real Telegram ids in practice for this app
        long hash = username.hashCode() & 0xffffffffL;
        return 2_000_000_000L + hash;
    }

    @Transactional(readOnly = true)
    public AuthResponse loginAdmin(AdminLoginRequest request) {
        AppUser admin = userRepository.findByAdminLogin(request.login())
                .filter(u -> u.getRole() == Role.ADMIN)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (admin.getPasswordHash() == null || !passwordEncoder.matches(request.password(), admin.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return new AuthResponse(jwtService.generateToken(admin), toMe(admin));
    }

    @Transactional
    public AuthResponse changeAdminCredentials(Long adminId, ChangePasswordRequest request) {
        AppUser admin = userRepository.findById(adminId)
                .filter(u -> u.getRole() == Role.ADMIN)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Admin not found"));

        if (!passwordEncoder.matches(request.currentPassword(), admin.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        userRepository.findByAdminLogin(request.newLogin()).ifPresent(existing -> {
            if (!existing.getId().equals(adminId)) {
                throw new ApiException(HttpStatus.CONFLICT, "Login already taken");
            }
        });

        admin.setAdminLogin(request.newLogin());
        admin.setUsername(request.newLogin());
        admin.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        admin.setMustChangePassword(false);
        admin = userRepository.save(admin);

        return new AuthResponse(jwtService.generateToken(admin), toMe(admin));
    }

    @Transactional(readOnly = true)
    public UserMeResponse me(Long userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return toMe(user);
    }

    private UserMeResponse toMe(AppUser user) {
        return new UserMeResponse(
                user.getId(),
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhotoUrl(),
                user.getRole().name(),
                user.isMustChangePassword()
        );
    }
}
