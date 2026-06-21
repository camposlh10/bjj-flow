package com.bjjflow.backend.wearables;

/** Supported wearable sources. Cloud providers use OAuth; Apple Health is on-device. */
public enum WearableProvider {

    WHOOP("WHOOP", true),
    GARMIN("Garmin", true),
    OURA("Oura", true),
    APPLE_HEALTH("Apple Saúde", false);

    private final String displayName;
    /** true = cloud OAuth (backend pulls); false = on-device push (e.g. HealthKit). */
    private final boolean oauth;

    WearableProvider(String displayName, boolean oauth) {
        this.displayName = displayName;
        this.oauth = oauth;
    }

    public String displayName() {
        return displayName;
    }

    public boolean isOauth() {
        return oauth;
    }

    public static WearableProvider parse(String raw) {
        if (raw != null) {
            for (WearableProvider p : values()) {
                if (p.name().equalsIgnoreCase(raw.trim())) {
                    return p;
                }
            }
        }
        return null;
    }
}
