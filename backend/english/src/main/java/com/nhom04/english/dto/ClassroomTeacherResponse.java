package com.nhom04.english.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ClassroomTeacherResponse {
    Long id;
    String username;
    String fullname;
    String email;
    String teacherCode;
    Boolean invited;
}
