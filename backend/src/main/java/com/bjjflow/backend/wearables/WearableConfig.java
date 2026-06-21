package com.bjjflow.backend.wearables;

import java.util.EnumMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Holds wearable OAuth client ids from the environment. Until real keys are set
 * (WEARABLE_WHOOP_CLIENT_ID etc.), cloud providers report as not configured and
 * {@link #authorizationUrl} returns null — the connect endpoint then says so honestly.
 */
@Component
public class WearableConfig {

    private final Map<WearableProvider, String> clientIds = new EnumMap<>(WearableProvider.class);
    private final String redirectUri;

    public WearableConfig(
            @Value("${wearable.whoop.client-id:}") String whoop,
            @Value("${wearable.garmin.client-id:}") String garmin,
            @Value("${wearable.oura.client-id:}") String oura,
            @Value("${wearable.redirect-uri:}") String redirectUri) {
        putIfPresent(WearableProvider.WHOOP, whoop);
        putIfPresent(WearableProvider.GARMIN, garmin);
        putIfPresent(WearableProvider.OURA, oura);
        this.redirectUri = redirectUri;
    }

    private void putIfPresent(WearableProvider provider, String clientId) {
        if (clientId != null && !clientId.isBlank()) {
            clientIds.put(provider, clientId.trim());
        }
    }

    /** Apple Health is on-device (always available); cloud providers need a client id. */
    public boolean isConfigured(WearableProvider provider) {
        return !provider.isOauth() || clientIds.containsKey(provider);
    }

    /** OAuth authorize URL for a configured cloud provider, or null. */
    public String authorizationUrl(WearableProvider provider, String state) {
        String clientId = clientIds.get(provider);
        if (clientId == null) {
            return null;
        }
        String redirect = redirectUri == null ? "" : "&redirect_uri=" + redirectUri;
        return switch (provider) {
            case WHOOP -> "https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id="
                    + clientId + "&scope=read:recovery%20read:sleep%20read:cycles&state=" + state + redirect;
            case OURA -> "https://cloud.ouraring.com/oauth/authorize?response_type=code&client_id="
                    + clientId + "&scope=daily&state=" + state + redirect;
            case GARMIN -> "https://connect.garmin.com/oauthConfirm?oauth_client_id="
                    + clientId + "&state=" + state + redirect;
            default -> null;
        };
    }
}
