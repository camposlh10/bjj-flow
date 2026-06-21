package com.bjjflow.backend.wearables;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bjjflow.backend.common.ApiException;
import com.bjjflow.backend.wearables.WearableDtos.BiometricDto;
import com.bjjflow.backend.wearables.WearableDtos.ConnectDto;
import com.bjjflow.backend.wearables.WearableDtos.IngestRequest;
import com.bjjflow.backend.wearables.WearableDtos.ProviderDto;
import com.bjjflow.backend.wearables.WearableDtos.SampleInput;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WearableService {

    private final WearableConnectionRepository connectionRepository;
    private final BiometricSampleRepository sampleRepository;
    private final WearableConfig config;

    @Transactional(readOnly = true)
    public List<ProviderDto> providers(Long userId) {
        Map<String, WearableConnection> byProvider = connectionRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(WearableConnection::getProvider, c -> c, (a, b) -> a));
        return Arrays.stream(WearableProvider.values()).map(p -> {
            WearableConnection c = byProvider.get(p.name());
            return new ProviderDto(p.name(), p.displayName(), p.isOauth(), config.isConfigured(p),
                    c != null ? c.getStatus() : "DISCONNECTED", c != null ? c.getConnectedAt() : null);
        }).toList();
    }

    @Transactional
    public ConnectDto connect(Long userId, String providerRaw) {
        WearableProvider provider = require(providerRaw);
        if (!config.isConfigured(provider)) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "PROVIDER_NOT_CONFIGURED",
                    provider.displayName() + " ainda não está disponível");
        }
        WearableConnection c = connectionRepository.findByUserIdAndProvider(userId, provider.name())
                .orElseGet(() -> {
                    WearableConnection fresh = new WearableConnection();
                    fresh.setUserId(userId);
                    fresh.setProvider(provider.name());
                    return fresh;
                });
        if (provider.isOauth()) {
            // Cloud provider: pending until the OAuth callback exchanges the code.
            c.setStatus("PENDING");
            connectionRepository.save(c);
            return new ConnectDto(provider.name(), "PENDING",
                    config.authorizationUrl(provider, String.valueOf(userId)), true);
        }
        // Apple Health: on-device, connected immediately; the app pushes samples.
        c.setStatus("CONNECTED");
        c.setConnectedAt(Instant.now());
        connectionRepository.save(c);
        return new ConnectDto(provider.name(), "CONNECTED", null, true);
    }

    @Transactional
    public void disconnect(Long userId, String providerRaw) {
        WearableProvider provider = require(providerRaw);
        connectionRepository.findByUserIdAndProvider(userId, provider.name()).ifPresent(c -> {
            c.setStatus("DISCONNECTED");
            c.setAccessToken(null);
            c.setRefreshToken(null);
            c.setConnectedAt(null);
            connectionRepository.save(c);
        });
        sampleRepository.deleteByUserIdAndProvider(userId, provider.name());
    }

    /** Ingest readings (Apple Health on-device push, or a cloud sync). Upserts by user+metric+date. */
    @Transactional
    public List<BiometricDto> ingest(Long userId, IngestRequest req) {
        WearableProvider provider = require(req.provider());
        for (SampleInput s : req.samples()) {
            BiometricMetric metric = BiometricMetric.parse(s.metric());
            if (metric == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_METRIC", "Unknown metric: " + s.metric());
            }
            BiometricSample sample = sampleRepository
                    .findByUserIdAndMetricAndSampleDate(userId, metric.name(), s.date())
                    .orElseGet(BiometricSample::new);
            sample.setUserId(userId);
            sample.setProvider(provider.name());
            sample.setMetric(metric.name());
            sample.setSampleDate(s.date());
            sample.setMetricValue(s.value());
            sample.setUnit(s.unit() != null && !s.unit().isBlank() ? s.unit() : metric.unit());
            sampleRepository.save(sample);
        }
        connectionRepository.findByUserIdAndProvider(userId, provider.name()).ifPresent(c -> {
            c.setLastSyncAt(Instant.now());
            if (!"CONNECTED".equals(c.getStatus())) {
                c.setStatus("CONNECTED");
                if (c.getConnectedAt() == null) {
                    c.setConnectedAt(Instant.now());
                }
            }
            connectionRepository.save(c);
        });
        return summary(userId);
    }

    /** Latest reading per metric — only metrics that have data, so the app unlocks just those tiles. */
    @Transactional(readOnly = true)
    public List<BiometricDto> summary(Long userId) {
        Map<String, BiometricSample> latest = new LinkedHashMap<>();
        for (BiometricSample s : sampleRepository.findByUserIdOrderBySampleDateDesc(userId)) {
            latest.putIfAbsent(s.getMetric(), s); // first seen = newest (ordered desc)
        }
        List<BiometricDto> out = new ArrayList<>();
        for (BiometricMetric m : BiometricMetric.values()) {
            BiometricSample s = latest.get(m.name());
            if (s != null) {
                out.add(new BiometricDto(m.name(), m.label(), s.getUnit() != null ? s.getUnit() : m.unit(),
                        s.getMetricValue(), s.getSampleDate(), s.getProvider()));
            }
        }
        return out;
    }

    private WearableProvider require(String raw) {
        WearableProvider p = WearableProvider.parse(raw);
        if (p == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PROVIDER", "Unknown provider: " + raw);
        }
        return p;
    }
}
