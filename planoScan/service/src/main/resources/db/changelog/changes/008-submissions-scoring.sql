--liquibase formatted sql

--changeset system:008-submissions-scoring
ALTER TABLE submissions ALTER COLUMN planogram_id DROP NOT NULL;

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS flagged_for_review  BOOLEAN      NOT NULL DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS scoring_attempts    INTEGER      NOT NULL DEFAULT 0;
