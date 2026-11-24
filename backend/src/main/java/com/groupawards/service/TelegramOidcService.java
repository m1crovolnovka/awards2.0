package com.groupawards.service;

import com.groupawards.util.ApiException;
import com.groupawards.util.TelegramAuthValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

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

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(JWKS).build();
        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(Duration.ofMinutes(2)),
                new JwtIssuerValidator(ISSUER)
        );
        decoder.setJwtValidator(validator);
        this.jwtDecoder = decoder;
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
        return telegramAuthValidator.getBotId();
    }

    public VerifiedTelegramUser verifyIdToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Missing id_token");
        }

        Set<Long> acceptedAudiences = new LinkedHashSet<>();
        long configured = getEffectiveClientId();
        if (configured > 0) {
            acceptedAudiences.add(configured);
        }
        long botId = telegramAuthValidator.getBotId();
        if (botId > 0) {
            acceptedAudiences.add(botId);
        }
        if (acceptedAudiences.isEmpty()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "TELEGRAM_CLIENT_ID is not configured");
        }

        try {
            Jwt jwt = jwtDecoder.decode(idToken);

            if (!audienceMatches(jwt, acceptedAudiences)) {
                log.warn("Telegram aud mismatch. tokenAud={}, accepted={}", jwt.getAudience(), acceptedAudiences);
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token audience");
            }

            Long telegramId = asLong(jwt.getClaim("id"));
            if (telegramId == null) {
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

    private static boolean audienceMatches(Jwt jwt, Set<Long> accepted) {
        List<String> audiences = jwt.getAudience();
        if (audiences != null) {
            for (String aud : audiences) {
                Long value = asLong(aud);
                if (value != null && accepted.contains(value)) {
                    return true;
                }
            }
        }
        Long claimAud = asLong(jwt.getClaim("aud"));
        return claimAud != null && accepted.contains(claimAud);
    }

    private static Long asLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        try {
            String s = String.valueOf(value).trim();
            if (s.isEmpty()) {
                return null;
            }
            // aud sometimes comes as JSON array string — take first number-like token
            if (s.startsWith("[")) {
                s = s.replaceAll("[^0-9]", " ").trim().split("\\s+")[0];
            }
            return Long.valueOf(s);
        } catch (Exception e) {
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
