package com.nhom04.english.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentDto {
    private Long id;
    private String title;
    private String description;
    private List<ClassroomDto> classrooms;
    private List<QuestionDto> questions;
}
