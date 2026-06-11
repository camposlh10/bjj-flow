package com.bjjflow.backend.posts;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GymPostSaveRepository extends JpaRepository<GymPostSave, Long> {

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    void deleteByPostIdAndUserId(Long postId, Long userId);

    void deleteByPostId(Long postId);

    List<GymPostSave> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
