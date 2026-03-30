package com.nhom04.english.service;

import com.nhom04.english.dto.QuestionDto;
import com.nhom04.english.entity.Assignment;
import com.nhom04.english.entity.Question;
import com.nhom04.english.repository.AssignmentRepository;
import com.nhom04.english.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    public QuestionDto addQuestionToAssignment(Long assignmentId, QuestionDto dto) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        Question question = new Question();
        question.setContent(dto.getContent());
        question.setType(dto.getType());
        question.setOptions(dto.getOptions() != null ? new ArrayList<>(dto.getOptions()) : new ArrayList<>());
        question.setCorrectAnswer(dto.getCorrectAnswer());
        question.setAssignment(assignment);

        Question saved = questionRepository.save(question);
        return mapToDto(saved);
    }

    public QuestionDto updateQuestion(Long id, QuestionDto dto) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        question.setContent(dto.getContent());
        question.setType(dto.getType());
        
        if (dto.getOptions() != null) {
            question.getOptions().clear();
            question.getOptions().addAll(dto.getOptions());
        }
        
        question.setCorrectAnswer(dto.getCorrectAnswer());

        Question saved = questionRepository.save(question);
        return mapToDto(saved);
    }

    public void deleteQuestion(Long id) {
        questionRepository.deleteById(id);
    }

    public QuestionDto mapToDto(Question question) {
        return new QuestionDto(
                question.getId(),
                question.getContent(),
                question.getType(),
                question.getOptions(),
                question.getCorrectAnswer()
        );
    }
}
