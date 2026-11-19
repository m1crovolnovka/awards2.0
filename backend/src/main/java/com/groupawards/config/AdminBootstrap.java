package com.groupawards.config;

import com.groupawards.entity.AppSettings;
import com.groupawards.entity.AppUser;
import com.groupawards.entity.Role;
import com.groupawards.repository.AppSettingsRepository;
import com.groupawards.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final AppSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.default-username}")
    private String defaultUsername;

    @Value("${app.admin.default-password}")
    private String defaultPassword;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByRole(Role.ADMIN)) {
            AppUser admin = AppUser.builder()
                    .adminLogin(defaultUsername)
                    .passwordHash(passwordEncoder.encode(defaultPassword))
                    .role(Role.ADMIN)
                    .mustChangePassword(true)
                    .username(defaultUsername)
                    .firstName("Admin")
                    .build();
            userRepository.save(admin);
            log.info("Default admin created (login={}, must change password on first login)", defaultUsername);
        }

        if (settingsRepository.findById(1L).isEmpty()) {
            settingsRepository.save(AppSettings.defaults());
        }
    }
}
