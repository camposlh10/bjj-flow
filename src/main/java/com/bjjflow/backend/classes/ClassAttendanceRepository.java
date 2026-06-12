package com.bjjflow.backend.classes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassAttendanceRepository extends JpaRepository<ClassAttendance, Long> {

    boolean existsByGymClassIdAndClassDateAndUserId(Long gymClassId, LocalDate classDate, Long userId);

    Optional<ClassAttendance> findByGymClassIdAndClassDateAndUserId(Long gymClassId, LocalDate classDate, Long userId);

    long countByGymClassIdAndClassDate(Long gymClassId, LocalDate classDate);

    List<ClassAttendance> findAllByGymClassIdAndClassDate(Long gymClassId, LocalDate classDate);

    void deleteByGymClassIdAndClassDateAndUserId(Long gymClassId, LocalDate classDate, Long userId);

    void deleteByGymClassId(Long gymClassId);

    /** Verified class attendances of a user within one gym after a point in time. */
    @Query("""
            select count(a) from ClassAttendance a, GymClass c
            where a.gymClassId = c.id and c.gymId = :gymId
              and a.userId = :userId and a.createdAt > :since
            """)
    long countForUserInGymSince(@Param("gymId") Long gymId, @Param("userId") Long userId,
            @Param("since") Instant since);
}
