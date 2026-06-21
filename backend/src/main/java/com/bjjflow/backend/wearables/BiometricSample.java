package com.bjjflow.backend.wearables;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One biometric reading for a day (e.g. RECOVERY 72%), pushed or pulled from a wearable. */
@Entity
@Table(name = "biometric_samples")
@Getter
@Setter
@NoArgsConstructor
public class BiometricSample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    private String provider;

    private String metric;

    @Column(name = "sample_date")
    private LocalDate sampleDate;

    @Column(name = "metric_value")
    private Double metricValue;

    private String unit;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
