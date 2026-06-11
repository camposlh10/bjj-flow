package com.bjjflow.backend.posts;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GymPostMediaRepository extends JpaRepository<GymPostMedia, Long> {

    List<GymPostMedia> findAllByPostIdOrderByPositionAsc(Long postId);

    void deleteByPostId(Long postId);
}
