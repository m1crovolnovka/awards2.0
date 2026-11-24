package com.groupawards.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Validates Telegram Mini App / WebApp initData.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
@Component
public class TelegramWebAppValidator {

    private final String botToken;
    private final ObjectMapper objectMapper;

    public TelegramWebAppValidator(
            @Value("${app.telegram.bot-token}") String botToken,
            ObjectMapper objectMapper
    ) {
        this.botToken = botToken;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return botToken != null && !botToken.isBlank() && !"REPLACE_ME".equals(botToken);
    }

    public JsonNode parseUserIfValid(String initData) {
        if (!isConfigured() || initData == null || initData.isBlank()) {
            return null;
        }

        Map<String, String> fields = new TreeMap<>();
        String receivedHash = null;
        for (String part : initData.split("&")) {
            int eq = part.indexOf('=');
            if (eq <= 0) {
                continue;
            }
            String key = URLDecoder.decode(part.substring(0, eq), StandardCharsets.UTF_8);
            String value = URLDecoder.decode(part.substring(eq + 1), StandardCharsets.UTF_8);
            if ("hash".equals(key)) {
                receivedHash = value;
            } else {
                fields.put(key, value);
            }
        }

        if (receivedHash == null || !fields.containsKey("user")) {
            return null;
        }

        List<String> parts = new ArrayList<>();
        fields.forEach((k, v) -> parts.add(k + "=" + v));
        String dataCheckString = String.join("\n", parts);

        try {
            Mac macKey = Mac.getInstance("HmacSHA256");
            macKey.init(new SecretKeySpec("WebAppData".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] secretKey = macKey.doFinal(botToken.getBytes(StandardCharsets.UTF_8));

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey, "HmacSHA256"));
            String calculated = HexFormat.of().formatHex(mac.doFinal(dataCheckString.getBytes(StandardCharsets.UTF_8)));
            if (!calculated.equalsIgnoreCase(receivedHash)) {
                return null;
            }
            return objectMapper.readTree(fields.get("user"));
        } catch (Exception e) {
            return null;
        }
    }
}
