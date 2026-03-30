package com.nhom04.english.dto;

import java.util.List;

import lombok.Data;

@Data
public class ClassroomRequest {
    private String name;
    private String description;
    private List<Long> studentIds;
}
