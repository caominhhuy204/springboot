package com.nhom04.english.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pronunciation_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PronunciationSubmission {

    public enum ReviewStatus {
        PENDING,
        REVIEWED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private PronunciationExercise exercise;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User student;

    @Column(nullable = false, length = 500)
    private String audioPath;

    @Column(nullable = false, length = 255)
    private String originalFilename;

    @Column(nullable = false)
    private Long fileSizeBytes;

    @Column(nullable = false)
    private Double durationSeconds;

    @Column(nullable = false)
    private Integer attemptNumber;

    @Column(nullable = false)
    private Integer autoCompletenessScore;

    @Column(nullable = false)
    private Integer autoFluencyScore;

    @Column(nullable = false)
    private Integer autoConsistencyScore;

    @Column(nullable = false)
    private Integer autoOverallScore;

    @Column(nullable = false, length = 1000)
    private String autoFeedback;

    private Integer teacherScore;

    @Column(length = 2000)
    private String teacherFeedback;

    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User reviewedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ReviewStatus reviewStatus;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    @PrePersist
    void onCreate() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }
}
