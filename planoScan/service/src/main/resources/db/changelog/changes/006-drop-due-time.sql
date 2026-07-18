--liquibase formatted sql

--changeset system:006-drop-due-time
ALTER TABLE store_assignments DROP COLUMN IF EXISTS due_time;
