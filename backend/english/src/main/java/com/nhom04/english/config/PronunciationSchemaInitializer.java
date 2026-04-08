package com.nhom04.english.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@ConditionalOnProperty(
        prefix = "app.startup",
        name = "migrate-pronunciation-schema",
        havingValue = "true",
        matchIfMissing = true)
@RequiredArgsConstructor
public class PronunciationSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        dropLegacyClassroomColumnIfPresent();
    }

    private void dropLegacyClassroomColumnIfPresent() {
        if (!columnExists("tv6_pronunciation_exercises", "classroom_id")) {
            return;
        }

        List<String> foreignKeys = jdbcTemplate.query(
                """
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'tv6_pronunciation_exercises'
                  AND COLUMN_NAME = 'classroom_id'
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                """,
                (rs, rowNum) -> rs.getString("CONSTRAINT_NAME"));

        for (String foreignKey : foreignKeys) {
            jdbcTemplate.execute("ALTER TABLE tv6_pronunciation_exercises DROP FOREIGN KEY " + foreignKey);
        }

        List<String> indexes = jdbcTemplate.query(
                """
                SELECT DISTINCT INDEX_NAME
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'tv6_pronunciation_exercises'
                  AND COLUMN_NAME = 'classroom_id'
                  AND INDEX_NAME <> 'PRIMARY'
                """,
                (rs, rowNum) -> rs.getString("INDEX_NAME"));

        for (String indexName : indexes) {
            jdbcTemplate.execute("ALTER TABLE tv6_pronunciation_exercises DROP INDEX " + indexName);
        }

        jdbcTemplate.execute("ALTER TABLE tv6_pronunciation_exercises DROP COLUMN classroom_id");
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                """,
                Integer.class,
                tableName,
                columnName);

        return count != null && count > 0;
    }
}
