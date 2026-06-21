package com.bjjflow.backend.wearables;

/** The biometric tiles unlocked by a wearable, with display label + unit (pt-BR). */
public enum BiometricMetric {

    RECOVERY("Recuperação", "%"),
    READINESS("Prontidão", "%"),
    SLEEP("Sono", "h"),
    HRV("HRV", "ms"),
    RESTING_HR("FC repouso", "bpm"),
    VO2MAX("VO₂máx", "ml/kg/min"),
    RECOVERY_TIME("Tempo de recuperação", "h");

    private final String label;
    private final String unit;

    BiometricMetric(String label, String unit) {
        this.label = label;
        this.unit = unit;
    }

    public String label() {
        return label;
    }

    public String unit() {
        return unit;
    }

    public static BiometricMetric parse(String raw) {
        if (raw != null) {
            for (BiometricMetric m : values()) {
                if (m.name().equalsIgnoreCase(raw.trim())) {
                    return m;
                }
            }
        }
        return null;
    }
}
