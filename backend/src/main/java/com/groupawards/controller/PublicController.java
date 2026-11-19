package com.groupawards.controller;

import com.groupawards.dto.NominationDtos.VotingStatus;
import com.groupawards.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final SettingsService settingsService;

    @Value("${app.telegram.bot-username}")
    private String botUsername;

    @GetMapping("/config")
    public Map<String, Object> config() {
        VotingStatus status = settingsService.status();
        return Map.of(
                "telegramBotUsername", botUsername,
                "votingOpen", status.votingOpen(),
                "announcementAt", status.announcementAt() != null ? status.announcementAt().toString() : ""
        );
    }

    @GetMapping("/voting-status")
    public VotingStatus votingStatus() {
        return settingsService.status();
    }
}
