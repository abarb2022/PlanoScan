--liquibase formatted sql

--changeset system:011-store-location
ALTER TABLE stores ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE stores ADD COLUMN longitude DOUBLE PRECISION;
