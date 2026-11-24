package com.groupawards.controller;

import com.groupawards.dto.NominationDtos.VotingStatus;
import com.groupawards.service.SettingsService;
import com.groupawards.service.TelegramOidcService;
import com.groupawards.util.TelegramAuthValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final SettingsService settingsService;
    private final TelegramAuthValidator telegramAuthValidator;
    private final TelegramOidcService telegramOidcService;

    @Value("${app.telegram.bot-username}")
    private String botUsername;

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/config")
    public Map<String, Object> config() {
        VotingStatus status = settingsService.status();
        long clientId = telegramOidcService.getEffectiveClientId();
        boolean oidc = telegramOidcService.isConfigured();

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("telegramBotUsername", botUsername);
        map.put("telegramBotId", telegramAuthValidator.getBotId());
        map.put("telegramClientId", clientId);
        map.put("telegramAuthMode", oidc ? "oidc" : "lite");
        map.put("liteAuthEnabled", telegramAuthValidator.isLiteAllowed());
        map.put("votingOpen", status.votingOpen());
        map.put("announcementAt", status.announcementAt() != null ? status.announcementAt().toString() : "");
        return map;
    }

    @GetMapping("/voting-status")
    public VotingStatus votingStatus() {
        return settingsService.status();
    }
}
