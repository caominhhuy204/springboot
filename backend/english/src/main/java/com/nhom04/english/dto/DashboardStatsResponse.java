package com.nhom04.english.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalUsers;
    private long totalTeachers;
    private long totalStudents;
    private long totalAdmins;
    private long totalClassrooms;
    private long pendingAccounts;
    private long totalAssignments;
    private long totalSubmissions;
    private long gradedSubmissions;
}
