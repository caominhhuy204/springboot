package com.nhom04.english.dto;

import java.util.List;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ClassroomResponse {
    Long id;
    String code;
    String name;
    String description;
    Long teacherId;
    String teacherName;
    String teacherEmail;
    Integer studentCount;
    List<ClassroomStudentResponse> students;
}
