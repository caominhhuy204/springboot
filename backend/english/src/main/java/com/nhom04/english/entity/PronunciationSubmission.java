package com.nhom04.english.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "tv6_pronunciation_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PronunciationSubmission {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User reviewedBy;

    @Column(nullable = false, length = 500)
    private String audioPath;

    @Column(nullable = false, length = 255)
    private String originalFilename;

    @Column(nullable = false, length = 100)
    private String contentType;

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

    @Column(length = 1000)
    private String teacherFeedback;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PronunciationReviewStatus reviewStatus;

    private LocalDateTime reviewedAt;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    @PrePersist
    void onCreate() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
        if (reviewStatus == null) {
            reviewStatus = PronunciationReviewStatus.PENDING;
        }
    }
}
