package com.nhom04.english.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "submission_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Question question;

    // Câu trả lời của sinh viên 
    @Column(columnDefinition = "TEXT")
    private String studentAnswer;

    private boolean isCorrect = false;

    // Số điểm của câu này sinh viên đạt được
    private double scoreAchieved = 0.0;
}
