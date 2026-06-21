package com.bjjflow.backend.wearables;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public class WearableDtos {

    public record ProviderDto(String provider, String displayName, boolean oauth, boolean configured,
            String status, Instant connectedAt) {
    }

    public record ConnectDto(String provider, String status, String authorizationUrl, boolean configured) {
    }

    public record BiometricDto(String metric, String label, String unit, double value, LocalDate date,
            String provider) {
    }

    public record SampleInput(
            @NotBlank String metric,
            @NotNull LocalDate date,
            @NotNull Double value,
            String unit) {
    }

    public record IngestRequest(
            @NotBlank String provider,
            @NotEmpty List<SampleInput> samples) {
    }
}
