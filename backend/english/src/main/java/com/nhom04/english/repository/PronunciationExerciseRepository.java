package com.nhom04.english.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nhom04.english.entity.PronunciationExercise;

public interface PronunciationExerciseRepository extends JpaRepository<PronunciationExercise, Long> {
    List<PronunciationExercise> findDistinctByClassroomsIdOrderByCreatedAtDescIdDesc(Long classroomId);
}
