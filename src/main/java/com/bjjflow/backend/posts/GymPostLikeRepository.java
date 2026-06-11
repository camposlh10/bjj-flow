package com.bjjflow.backend.posts;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GymPostLikeRepository extends JpaRepository<GymPostLike, Long> {

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    long countByPostId(Long postId);

    void deleteByPostIdAndUserId(Long postId, Long userId);

    void deleteByPostId(Long postId);
}
