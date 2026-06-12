package com.bjjflow.backend.classes;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassAttendanceRepository extends JpaRepository<ClassAttendance, Long> {

    boolean existsByGymClassIdAndClassDateAndUserId(Long gymClassId, LocalDate classDate, Long userId);

    Optional<ClassAttendance> findByGymClassIdAndClassDateAndUserId(Long gymClassId, LocalDate classDate, Long userId);

    long countByGymClassIdAndClassDate(Long gymClassId, LocalDate classDate);

    List<ClassAttendance> findAllByGymClassIdAndClassDate(Long gymClassId, LocalDate classDate);

    void deleteByGymClassIdAndClassDateAndUserId(Long gymClassId, LocalDate classDate, Long userId);

    void deleteByGymClassId(Long gymClassId);
}
