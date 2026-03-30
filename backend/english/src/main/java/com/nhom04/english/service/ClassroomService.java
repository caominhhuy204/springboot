package com.nhom04.english.service;

import com.nhom04.english.dto.ClassroomDto;
import com.nhom04.english.entity.Classroom;
import com.nhom04.english.repository.ClassroomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClassroomService {

    @Autowired
    private ClassroomRepository classroomRepository;

    public ClassroomDto createClassroom(ClassroomDto dto) {
        Classroom classroom = new Classroom();
        classroom.setName(dto.getName());
        classroom.setDescription(dto.getDescription());
        
        Classroom saved = classroomRepository.save(classroom);
        return mapToDto(saved);
    }

    public List<ClassroomDto> getAllClassrooms() {
        return classroomRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private ClassroomDto mapToDto(Classroom classroom) {
        return new ClassroomDto(
                classroom.getId(),
                classroom.getName(),
                classroom.getDescription()
        );
    }
}
