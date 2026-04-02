package com.nhom04.english.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nhom04.english.entity.Classroom;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {

    Optional<Classroom> findByCodeIgnoreCase(String code);
}
