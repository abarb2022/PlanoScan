--liquibase formatted sql
--changeset system:009-cleanup-stub-planograms

-- The old createSubmission code created a Planogram stub for every rep photo.
-- Those records have reference_image_url pointing to /uploads/submissions/ (the rep's own photo).
-- Real manager-uploaded planograms use /uploads/planograms/.
-- Unlink submissions from the stubs first (FK), then delete the stubs.

UPDATE submissions
SET planogram_id = NULL
WHERE planogram_id IN (
    SELECT id FROM planograms WHERE reference_image_url LIKE '/uploads/submissions/%'
);

DELETE FROM planogram_assignments
WHERE planogram_id IN (
    SELECT id FROM planograms WHERE reference_image_url LIKE '/uploads/submissions/%'
);

DELETE FROM planograms
WHERE reference_image_url LIKE '/uploads/submissions/%';
