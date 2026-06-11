package com.bjjflow.backend.gyms;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GymRepository extends JpaRepository<Gym, Long> {

    List<Gym> findAllByCityIgnoreCase(String city);
}
