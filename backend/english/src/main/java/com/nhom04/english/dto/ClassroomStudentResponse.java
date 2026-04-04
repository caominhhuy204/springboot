package com.nhom04.english.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ClassroomStudentResponse {
    Long id;
    String username;
    String fullname;
    String email;
    String studentCode;
    Boolean invited;
}
