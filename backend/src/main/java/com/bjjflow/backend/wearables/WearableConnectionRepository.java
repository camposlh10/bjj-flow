package com.bjjflow.backend.wearables;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WearableConnectionRepository extends JpaRepository<WearableConnection, Long> {

    List<WearableConnection> findByUserId(Long userId);

    Optional<WearableConnection> findByUserIdAndProvider(Long userId, String provider);
}
