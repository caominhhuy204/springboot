package com.nhom04.english.dto;

import lombok.Data;
import java.util.List;

@Data
public class AssignClassroomsRequest {
    private List<Long> classroomIds;
}
