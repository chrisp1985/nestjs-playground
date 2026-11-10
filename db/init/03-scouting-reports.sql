-- Backs src/scouting/entities/scouting-report.entity.ts.
-- Column names are quoted to match the entity's camelCase property names.
CREATE TABLE scouting_reports (
    "reportId"    UUID PRIMARY KEY,
    "playerNo"    INTEGER NOT NULL,
    status        VARCHAR(20) NOT NULL,
    result        JSONB,
    "requestedAt" TIMESTAMPTZ NOT NULL,
    "completedAt" TIMESTAMPTZ
);
