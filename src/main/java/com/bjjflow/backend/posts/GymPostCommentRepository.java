package com.bjjflow.backend.posts;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GymPostCommentRepository extends JpaRepository<GymPostComment, Long> {

    List<GymPostComment> findAllByPostIdOrderByCreatedAtAsc(Long postId);

    long countByPostId(Long postId);

    void deleteByPostId(Long postId);
}
