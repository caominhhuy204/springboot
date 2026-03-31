package com.nhom04.english.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SchemaMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        migratePronunciationSubmissionColumns();
    }

    private void migratePronunciationSubmissionColumns() {
        Integer tableExists = jdbcTemplate.queryForObject(
                """
                select count(*)
                from information_schema.tables
                where table_schema = database()
                  and table_name = 'pronunciation_submissions'
                """,
                Integer.class);

        if (tableExists == null || tableExists == 0) {
            return;
        }

        String columnType = jdbcTemplate.queryForObject(
                """
                select data_type
                from information_schema.columns
                where table_schema = database()
                  and table_name = 'pronunciation_submissions'
                  and column_name = 'review_status'
                """,
                String.class);

        if (columnType != null && !"varchar".equalsIgnoreCase(columnType)) {
            jdbcTemplate.execute(
                    "alter table pronunciation_submissions modify column review_status varchar(40) not null");
        }

        Integer teacherFeedbackLength = jdbcTemplate.queryForObject(
                """
                select character_maximum_length
                from information_schema.columns
                where table_schema = database()
                  and table_name = 'pronunciation_submissions'
                  and column_name = 'teacher_feedback'
                """,
                Integer.class);

        if (teacherFeedbackLength != null && teacherFeedbackLength < 2000) {
            jdbcTemplate.execute(
                    "alter table pronunciation_submissions modify column teacher_feedback varchar(2000)");
        }

        relaxLegacyColumn("completeness_score", "int null");
        relaxLegacyColumn("fluency_score", "int null");
        relaxLegacyColumn("consistency_score", "int null");
        relaxLegacyColumn("overall_score", "int null");
        relaxLegacyColumn("feedback", "varchar(2000) null");
    }

    private void relaxLegacyColumn(String columnName, String ddlDefinition) {
        Integer columnExists = jdbcTemplate.queryForObject(
                """
                select count(*)
                from information_schema.columns
                where table_schema = database()
                  and table_name = 'pronunciation_submissions'
                  and column_name = ?
                """,
                Integer.class,
                columnName);

        if (columnExists != null && columnExists > 0) {
            jdbcTemplate.execute(
                    "alter table pronunciation_submissions modify column " + columnName + " " + ddlDefinition);
        }
    }
}
