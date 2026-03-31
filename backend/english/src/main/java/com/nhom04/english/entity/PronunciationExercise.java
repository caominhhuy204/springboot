package com.nhom04.english.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pronunciation_exercises")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PronunciationExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 1000)
    private String referenceText;

    @Column(length = 1000)
    private String description;

    @Column(length = 120)
    private String focusSkill;

    @Column(nullable = false)
    private Integer difficultyLevel;

    @Column(nullable = false)
    private Integer maxAttempts;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classroom_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User createdBy;

    @OneToMany(mappedBy = "exercise", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<PronunciationSubmission> submissions = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (difficultyLevel == null) {
            difficultyLevel = 1;
        }
        if (maxAttempts == null) {
            maxAttempts = 3;
        }
    }
}
