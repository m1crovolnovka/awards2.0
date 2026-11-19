package com.groupawards.util;

import com.groupawards.dto.AuthDtos.TelegramAuthRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Component
public class TelegramAuthValidator {

    private final String botToken;
    private final long maxAgeSeconds;

    public TelegramAuthValidator(
            @Value("${app.telegram.bot-token}") String botToken,
            @Value("${app.telegram.auth-max-age-seconds}") long maxAgeSeconds
    ) {
        this.botToken = botToken;
        this.maxAgeSeconds = maxAgeSeconds;
    }

    public boolean isValid(TelegramAuthRequest request) {
        if (request == null || request.id() == null || request.hash() == null || request.auth_date() == null) {
            return false;
        }
        if ("REPLACE_ME".equals(botToken) || botToken.isBlank()) {
            // Dev mode: accept only explicitly mocked payloads with hash=dev
            return "dev".equalsIgnoreCase(request.hash());
        }

        long age = Instant.now().getEpochSecond() - request.auth_date();
        if (age < 0 || age > maxAgeSeconds) {
            return false;
        }

        Map<String, String> fields = new TreeMap<>();
        fields.put("id", String.valueOf(request.id()));
        fields.put("auth_date", String.valueOf(request.auth_date()));
        if (request.first_name() != null) {
            fields.put("first_name", request.first_name());
        }
        if (request.last_name() != null) {
            fields.put("last_name", request.last_name());
        }
        if (request.username() != null) {
            fields.put("username", request.username());
        }
        if (request.photo_url() != null) {
            fields.put("photo_url", request.photo_url());
        }

        List<String> parts = new ArrayList<>();
        fields.forEach((k, v) -> parts.add(k + "=" + v));
        String dataCheckString = String.join("\n", parts);

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] secretKey = digest.digest(botToken.getBytes(StandardCharsets.UTF_8));
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey, "HmacSHA256"));
            byte[] hash = mac.doFinal(dataCheckString.getBytes(StandardCharsets.UTF_8));
            String calculated = HexFormat.of().formatHex(hash);
            return calculated.equalsIgnoreCase(request.hash());
        } catch (Exception e) {
            return false;
        }
    }
}
