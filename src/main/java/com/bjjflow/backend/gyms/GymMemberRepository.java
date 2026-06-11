package com.bjjflow.backend.gyms;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GymMemberRepository extends JpaRepository<GymMember, Long> {

    Optional<GymMember> findByGymIdAndUserId(Long gymId, Long userId);

    List<GymMember> findAllByUserId(Long userId);

    long countByGymId(Long gymId);
}
