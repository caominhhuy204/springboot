package com.nhom04.english.dto;

import com.nhom04.english.entity.QuestionType;
import lombok.Data;
import java.util.List;

@Data
public class AssignmentDto {
    private Long id;
    private String title;
    private String description;
    private List<ClassroomDto> classrooms;
    private List<QuestionDto> questions;
}
