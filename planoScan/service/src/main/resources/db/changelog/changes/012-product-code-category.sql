--liquibase formatted sql

--changeset system:012-product-code-category
ALTER TABLE products RENAME COLUMN sku TO code;
ALTER TABLE products ADD COLUMN category VARCHAR(255);
