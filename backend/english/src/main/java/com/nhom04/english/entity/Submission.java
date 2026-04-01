package com.nhom04.english.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tv5_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User student;

    @Column(nullable = false)
    private Integer totalScore;

    @Column(nullable = false)
    private Integer correctAnswersCount;

    @Column(nullable = false)
    private Integer totalQuestionsCount;

    @Column(length = 2000)
    private String studentAnswersJson; // Stores answers as JSON string for history

    @Column(length = 1000)
    private String teacherFeedback;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
    }
}
