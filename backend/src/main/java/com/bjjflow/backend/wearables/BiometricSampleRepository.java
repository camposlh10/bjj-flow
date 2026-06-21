package com.bjjflow.backend.wearables;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface BiometricSampleRepository extends JpaRepository<BiometricSample, Long> {

    /** Newest-first so the service can keep the latest reading per metric. */
    List<BiometricSample> findByUserIdOrderBySampleDateDesc(Long userId);

    Optional<BiometricSample> findByUserIdAndMetricAndSampleDate(Long userId, String metric, java.time.LocalDate date);

    @Transactional
    void deleteByUserIdAndProvider(Long userId, String provider);
}
