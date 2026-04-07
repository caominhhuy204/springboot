package com.nhom04.english.repository;

import com.nhom04.english.entity.Submission;
import com.nhom04.english.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByStudentOrderByCreatedAtDesc(User student);
    long countByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    long count();

    @Query("SELECT COUNT(s) FROM Submission s WHERE s.createdAt >= :since")
    long countSubmittedAfter(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(s) FROM Submission s WHERE s.createdAt >= :since AND s.teacherFeedback IS NOT NULL AND s.teacherFeedback <> ''")
    long countGradedAfter(@Param("since") LocalDateTime since);
}
