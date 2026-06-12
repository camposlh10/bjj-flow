package com.bjjflow.backend.checkins;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CheckInRepository extends JpaRepository<CheckIn, Long> {

    List<CheckIn> findAllByUserIdAndCheckDateBetweenOrderByCheckDateAsc(Long userId, LocalDate from, LocalDate to);

    long countByUserId(Long userId);

    boolean existsByUserIdAndCheckDate(Long userId, LocalDate checkDate);

    @Query("select coalesce(sum(c.durationMinutes), 0) from CheckIn c where c.userId = :userId")
    long sumDurationMinutes(@Param("userId") Long userId);

    @Query("select count(distinct c.checkDate) from CheckIn c where c.userId = :userId and c.checkDate between :from and :to")
    long countDistinctDays(@Param("userId") Long userId, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
