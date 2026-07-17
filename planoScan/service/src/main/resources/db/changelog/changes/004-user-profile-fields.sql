--liquibase formatted sql

--changeset system:004-user-profile-fields
ALTER TABLE users ADD COLUMN surname VARCHAR(255);
ALTER TABLE users ADD COLUMN phone VARCHAR(50);
