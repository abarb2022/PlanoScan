--liquibase formatted sql

--changeset system:006-store-assignment-due-time
ALTER TABLE store_assignments ADD COLUMN IF NOT EXISTS due_time TIME;
