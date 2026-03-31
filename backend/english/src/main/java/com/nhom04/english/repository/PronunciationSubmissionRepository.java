package com.nhom04.english.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nhom04.english.entity.PronunciationSubmission;

public interface PronunciationSubmissionRepository extends JpaRepository<PronunciationSubmission, Long> {
    List<PronunciationSubmission> findByExerciseIdOrderBySubmittedAtDesc(Long exerciseId);

    List<PronunciationSubmission> findByExerciseIdAndStudentIdOrderBySubmittedAtDesc(Long exerciseId, Long studentId);

    Optional<PronunciationSubmission> findTopByExerciseIdAndStudentIdOrderByAttemptNumberDesc(Long exerciseId, Long studentId);
}
