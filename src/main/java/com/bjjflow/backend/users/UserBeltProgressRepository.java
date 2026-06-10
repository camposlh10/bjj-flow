package com.bjjflow.backend.users;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBeltProgressRepository extends JpaRepository<UserBeltProgress, Long> {

    Optional<UserBeltProgress> findByUserId(Long userId);
}
