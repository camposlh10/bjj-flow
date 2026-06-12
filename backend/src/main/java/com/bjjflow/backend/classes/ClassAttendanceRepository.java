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

    /** Verified (PRESENT) class attendances of a user within one gym after a point in time. */
    @Query("""
            select count(a) from ClassAttendance a, GymClass c
            where a.gymClassId = c.id and c.gymId = :gymId and a.status = 'PRESENT'
              and a.userId = :userId and a.createdAt > :since
            """)
    long countForUserInGymSince(@Param("gymId") Long gymId, @Param("userId") Long userId,
            @Param("since") Instant since);

    /** All PRESENT attendance rows (userId, createdAt) of a gym, for batched counting. */
    @Query("""
            select a.userId, a.createdAt from ClassAttendance a, GymClass c
            where a.gymClassId = c.id and c.gymId = :gymId and a.status = 'PRESENT'
            """)
    List<Object[]> attendanceTimesForGym(@Param("gymId") Long gymId);

    List<ClassAttendance> findAllByUserIdAndClassDateBetween(Long userId, LocalDate from, LocalDate to);

    @Query("""
            select a.gymClassId, a.classDate, count(a) from ClassAttendance a
            where a.classDate between :from and :to
            group by a.gymClassId, a.classDate
            """)
    List<Object[]> countsBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
