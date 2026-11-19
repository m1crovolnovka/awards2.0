package com.groupawards.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate @Lob on PostgreSQL can create OID columns; we need BYTEA.
 * Fixes existing DBs that were created with the wrong type.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class ByteaSchemaFixer implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        fixColumn("nominations", "image_data");
        fixColumn("nominees", "image_data");
    }

    private void fixColumn(String table, String column) {
        try {
            String dataType = jdbc.query(
                    """
                    SELECT data_type
                    FROM information_schema.columns
                    WHERE table_name = ? AND column_name = ?
                    """,
                    rs -> rs.next() ? rs.getString(1) : null,
                    table,
                    column
            );

            if (dataType == null) {
                return;
            }

            // oid / bigint / numeric means wrong mapping for binary images
            if ("bytea".equalsIgnoreCase(dataType)) {
                return;
            }

            log.warn("Fixing {}.{} from {} to bytea", table, column, dataType);
            jdbc.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " DROP DEFAULT");
            jdbc.execute(
                    "ALTER TABLE " + table + " ALTER COLUMN " + column
                            + " TYPE bytea USING NULL"
            );
            log.info("Fixed {}.{} → bytea", table, column);
        } catch (Exception e) {
            log.warn("Could not fix {}.{}: {}", table, column, e.getMessage());
        }
    }
}
