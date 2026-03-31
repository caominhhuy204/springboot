package com.nhom04.english.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Assignment assignment;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private QuestionType type;

    // Dành cho trắc nghiệm: Option dạng chuỗi JSON hoặc cách nhau bằng dấu phẩy
    @Column(columnDefinition = "TEXT")
    private String options; 

    @Column(columnDefinition = "TEXT", nullable = false)
    private String correctAnswer;

    // Số điểm của mỗi câu
    private double points = 1.0;
}
