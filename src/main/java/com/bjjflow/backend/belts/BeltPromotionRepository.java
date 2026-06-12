package com.bjjflow.backend.belts;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BeltPromotionRepository extends JpaRepository<BeltPromotion, Long> {

    Optional<BeltPromotion> findFirstByUserIdOrderByCreatedAtDesc(Long userId);
}
