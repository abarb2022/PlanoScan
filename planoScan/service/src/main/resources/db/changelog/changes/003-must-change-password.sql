--liquibase formatted sql

--changeset system:003-must-change-password
ALTER TABLE users
    ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
