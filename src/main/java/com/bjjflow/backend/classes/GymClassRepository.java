package com.bjjflow.backend.classes;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GymClassRepository extends JpaRepository<GymClass, Long> {

    List<GymClass> findAllByGymIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(Long gymId);
}
