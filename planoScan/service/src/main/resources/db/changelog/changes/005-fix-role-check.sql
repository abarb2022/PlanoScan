--liquibase formatted sql

--changeset system:005-fix-role-check
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('REP', 'MANAGER', 'ADMIN'));
