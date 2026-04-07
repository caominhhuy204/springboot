package com.nhom04.english.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts = 1;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;

    @Column(name = "due_at")
    private LocalDateTime dueAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User createdBy;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "assignment_classroom",
        joinColumns = @JoinColumn(name = "assignment_id"),
        inverseJoinColumns = @JoinColumn(name = "classroom_id")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Classroom> classrooms = new ArrayList<>();

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Question> questions = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
