package com.nhom04.english.dto;

import java.util.List;

import lombok.Data;

@Data
public class ClassroomRequest {
    private String code;
    private String name;
    private String description;
    private Long teacherId;
    private List<Long> studentIds;
}
