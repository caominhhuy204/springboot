package com.nhom04.english.service;

import com.nhom04.english.dto.AssignmentDto;
import com.nhom04.english.dto.AssignmentRequestDto;
import com.nhom04.english.dto.ClassroomDto;
import com.nhom04.english.entity.Assignment;
import com.nhom04.english.entity.Classroom;
import com.nhom04.english.repository.AssignmentRepository;
import com.nhom04.english.repository.ClassroomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    @Autowired
    private AssignmentRepository assignmentRepository;
    
    @Autowired
    private QuestionService questionService;
    
    @Autowired
    private ClassroomRepository classroomRepository;

    public AssignmentDto createAssignment(AssignmentRequestDto dto) {
        Assignment assignment = new Assignment();
        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        
        Assignment saved = assignmentRepository.save(assignment);
        return mapToDto(saved);
    }

    public AssignmentDto updateAssignment(Long id, AssignmentRequestDto dto) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        
        Assignment saved = assignmentRepository.save(assignment);
        return mapToDto(saved);
    }

    public void deleteAssignment(Long id) {
        assignmentRepository.deleteById(id);
    }

    public List<AssignmentDto> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    public AssignmentDto assignToClassroom(Long assignmentId, Long classroomId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
                
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));
                
        if (!assignment.getClassrooms().contains(classroom)) {
            assignment.getClassrooms().add(classroom);
        }
        
        Assignment saved = assignmentRepository.save(assignment);
        return mapToDto(saved);
    }

    private AssignmentDto mapToDto(Assignment assignment) {
        return new AssignmentDto(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getClassrooms().stream()
                    .map(c -> new ClassroomDto(c.getId(), c.getName(), c.getDescription()))
                    .collect(Collectors.toList()),
                assignment.getQuestions().stream()
                    .map(questionService::mapToDto)
                    .collect(Collectors.toList())
        );
    }
}
