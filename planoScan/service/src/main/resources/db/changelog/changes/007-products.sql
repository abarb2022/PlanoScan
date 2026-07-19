--liquibase formatted sql

--changeset system:007-products
CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID         NOT NULL REFERENCES companies(id),
    name        VARCHAR(255) NOT NULL,
    sku         VARCHAR(100),
    description TEXT,
    reference_image_url VARCHAR(1000),
    created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT products_name_company UNIQUE (name, company_id)
);

CREATE INDEX idx_products_company ON products(company_id);
