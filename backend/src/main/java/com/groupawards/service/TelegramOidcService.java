package com.groupawards.service;

import com.groupawards.util.ApiException;
import com.groupawards.util.TelegramAuthValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

/**
 * Validates id_token from the new Telegram Login library (OIDC).
 * https://core.telegram.org/bots/telegram-login
 */
@Service
@Slf4j
public class TelegramOidcService {

    private static final String ISSUER = "https://oauth.telegram.org";
    private static final String JWKS = "https://oauth.telegram.org/.well-known/jwks.json";

    private final String clientId;
    private final TelegramAuthValidator telegramAuthValidator;
    private final JwtDecoder jwtDecoder;

    public TelegramOidcService(
            @Value("${app.telegram.client-id:}") String clientId,
            TelegramAuthValidator telegramAuthValidator
    ) {
        this.clientId = clientId == null ? "" : clientId.trim();
        this.telegramAuthValidator = telegramAuthValidator;
        this.jwtDecoder = NimbusJwtDecoder.withJwkSetUri(JWKS).build();
    }

    public boolean isConfigured() {
        return getEffectiveClientId() > 0;
    }

    public long getEffectiveClientId() {
        if (!clientId.isBlank()) {
            try {
                return Long.parseLong(clientId);
            } catch (NumberFormatException ignored) {
                return 0L;
            }
        }
        // Fallback: bot id from token (often equals Client ID)
        return telegramAuthValidator.getBotId();
    }

    public VerifiedTelegramUser verifyIdToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Missing id_token");
        }
        long expectedAud = getEffectiveClientId();
        if (expectedAud <= 0) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "TELEGRAM_CLIENT_ID is not configured");
        }

        try {
            Jwt jwt = jwtDecoder.decode(idToken);
            String iss = jwt.getClaimAsString("iss");
            if (iss == null || !(ISSUER.equals(iss) || (ISSUER + "/").equals(iss))) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token issuer");
            }

            Object aud = jwt.getAudience() != null && !jwt.getAudience().isEmpty()
                    ? jwt.getAudience().getFirst()
                    : jwt.getClaim("aud");
            String audStr = aud == null ? "" : String.valueOf(aud);
            if (!String.valueOf(expectedAud).equals(audStr)) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token audience");
            }

            Long telegramId = asLong(jwt.getClaim("id"));
            if (telegramId == null) {
                // OIDC sub may be used in some tokens
                telegramId = asLong(jwt.getClaim("sub"));
            }
            if (telegramId == null) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Token has no user id");
            }

            String given = jwt.getClaimAsString("given_name");
            String family = jwt.getClaimAsString("family_name");
            String name = jwt.getClaimAsString("name");
            String username = jwt.getClaimAsString("preferred_username");
            String picture = jwt.getClaimAsString("picture");

            String firstName = given != null ? given : (name != null ? name : username);
            return new VerifiedTelegramUser(telegramId, firstName, family, username, picture);
        } catch (ApiException e) {
            throw e;
        } catch (JwtException e) {
            log.warn("Telegram id_token verification failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Telegram id_token");
        }
    }

    private static Long asLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.valueOf(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public record VerifiedTelegramUser(
            long telegramId,
            String firstName,
            String lastName,
            String username,
            String photoUrl
    ) {
    }
}
