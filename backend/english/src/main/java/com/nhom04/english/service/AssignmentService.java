package com.nhom04.english.service;

import com.nhom04.english.dto.AssignmentDto;
import com.nhom04.english.dto.ClassroomDto;
import com.nhom04.english.dto.QuestionDto;
import com.nhom04.english.entity.Assignment;
import com.nhom04.english.entity.Classroom;
import com.nhom04.english.entity.Question;
import com.nhom04.english.repository.AssignmentRepository;
import com.nhom04.english.repository.ClassroomRepository;
import com.nhom04.english.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final QuestionRepository questionRepository;
    private final ClassroomRepository classroomRepository;

    public List<AssignmentDto> getAllAssignments() {
        return assignmentRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public AssignmentDto getAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Assignment not found"));
        return mapToDto(assignment);
    }

    @Transactional
    public AssignmentDto createAssignment(AssignmentDto dto) {
        Assignment assignment = new Assignment();
        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        Assignment saved = assignmentRepository.save(assignment);
        return mapToDto(saved);
    }

    @Transactional
    public AssignmentDto updateAssignment(Long id, AssignmentDto dto) {
        Assignment assignment = assignmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Assignment not found"));
        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        Assignment saved = assignmentRepository.save(assignment);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteAssignment(Long id) {
        assignmentRepository.deleteById(id);
    }

    @Transactional
    public void assignToClassrooms(Long id, List<Long> classroomIds) {
        Assignment assignment = assignmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Assignment not found"));
        List<Classroom> classrooms = classroomRepository.findAllById(classroomIds);
        assignment.setClassrooms(classrooms);
        assignmentRepository.save(assignment);
    }

    // Question operations
    public List<QuestionDto> getQuestionsByAssignmentId(Long assignmentId) {
        return questionRepository.findByAssignmentId(assignmentId).stream()
                .map(this::mapQuestionToDto).collect(Collectors.toList());
    }

    @Transactional
    public QuestionDto addQuestion(Long assignmentId, QuestionDto dto) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        Question question = new Question();
        question.setAssignment(assignment);
        question.setContent(dto.getContent());
        question.setType(dto.getType());
        question.setOptions(dto.getOptions());
        question.setCorrectAnswer(dto.getCorrectAnswer());
        question.setPoints(dto.getPoints());
        return mapQuestionToDto(questionRepository.save(question));
    }

    @Transactional
    public QuestionDto updateQuestion(Long questionId, QuestionDto dto) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        question.setContent(dto.getContent());
        question.setType(dto.getType());
        question.setOptions(dto.getOptions());
        question.setCorrectAnswer(dto.getCorrectAnswer());
        question.setPoints(dto.getPoints());
        return mapQuestionToDto(questionRepository.save(question));
    }

    @Transactional
    public void deleteQuestion(Long questionId) {
        questionRepository.deleteById(questionId);
    }

    private AssignmentDto mapToDto(Assignment assignment) {
        AssignmentDto dto = new AssignmentDto();
        dto.setId(assignment.getId());
        dto.setTitle(assignment.getTitle());
        dto.setDescription(assignment.getDescription());
        if (assignment.getClassrooms() != null) {
            dto.setClassrooms(assignment.getClassrooms().stream()
                .map(classroom -> new ClassroomDto(classroom.getId(), classroom.getName()))
                .collect(Collectors.toList()));
        }
        if (assignment.getQuestions() != null) {
            dto.setQuestions(assignment.getQuestions().stream()
                .map(this::mapQuestionToDto)
                .collect(Collectors.toList()));
        }
        return dto;
    }

    private QuestionDto mapQuestionToDto(Question question) {
        QuestionDto dto = new QuestionDto();
        dto.setId(question.getId());
        dto.setContent(question.getContent());
        dto.setType(question.getType());
        dto.setOptions(question.getOptions());
        dto.setCorrectAnswer(question.getCorrectAnswer());
        dto.setPoints(question.getPoints());
        return dto;
    }
}
