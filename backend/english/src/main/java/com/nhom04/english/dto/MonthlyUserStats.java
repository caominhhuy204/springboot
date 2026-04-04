package com.nhom04.english.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyUserStats {
    private String month;
    private long students;
    private long teachers;
}
