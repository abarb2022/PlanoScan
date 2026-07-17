--liquibase formatted sql

--changeset system:001-initial-schema
CREATE TABLE companies
(
    id         UUID         NOT NULL,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    CONSTRAINT pk_companies PRIMARY KEY (id)
);

CREATE TABLE users
(
    id            UUID         NOT NULL,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL,
    company_id    UUID         NOT NULL,
    created_at    TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies (id)
);

CREATE TABLE stores
(
    id         UUID         NOT NULL,
    name       VARCHAR(255) NOT NULL,
    address    VARCHAR(255),
    company_id UUID         NOT NULL,
    created_at TIMESTAMP,
    CONSTRAINT pk_stores PRIMARY KEY (id),
    CONSTRAINT fk_stores_company FOREIGN KEY (company_id) REFERENCES companies (id)
);

CREATE TABLE planograms
(
    id                  UUID         NOT NULL,
    company_id          UUID         NOT NULL,
    name                VARCHAR(255) NOT NULL,
    product_category    VARCHAR(255),
    layout_spec         JSONB,
    reference_image_url VARCHAR(255),
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    valid_from          DATE,
    valid_until         DATE,
    created_at          TIMESTAMP,
    CONSTRAINT pk_planograms PRIMARY KEY (id),
    CONSTRAINT fk_planograms_company FOREIGN KEY (company_id) REFERENCES companies (id)
);

CREATE TABLE planogram_assignments
(
    id           UUID NOT NULL,
    planogram_id UUID NOT NULL,
    store_id     UUID NOT NULL,
    valid_from   DATE,
    valid_until  DATE,
    CONSTRAINT pk_planogram_assignments PRIMARY KEY (id),
    CONSTRAINT fk_planogram_assignments_planogram FOREIGN KEY (planogram_id) REFERENCES planograms (id),
    CONSTRAINT fk_planogram_assignments_store FOREIGN KEY (store_id) REFERENCES stores (id)
);

CREATE TABLE submissions
(
    id           UUID         NOT NULL,
    rep_id       UUID         NOT NULL,
    store_id     UUID         NOT NULL,
    planogram_id UUID         NOT NULL,
    photo_url    VARCHAR(255) NOT NULL,
    status       VARCHAR(50)  NOT NULL,
    submitted_at TIMESTAMP,
    CONSTRAINT pk_submissions PRIMARY KEY (id),
    CONSTRAINT fk_submissions_rep FOREIGN KEY (rep_id) REFERENCES users (id),
    CONSTRAINT fk_submissions_store FOREIGN KEY (store_id) REFERENCES stores (id),
    CONSTRAINT fk_submissions_planogram FOREIGN KEY (planogram_id) REFERENCES planograms (id)
);

CREATE TABLE scores
(
    id               UUID  NOT NULL,
    submission_id    UUID  NOT NULL,
    overall_score    FLOAT NOT NULL,
    detail_flags     JSONB,
    ai_model_version VARCHAR(255),
    scored_at        TIMESTAMP,
    CONSTRAINT pk_scores PRIMARY KEY (id),
    CONSTRAINT uq_scores_submission UNIQUE (submission_id),
    CONSTRAINT fk_scores_submission FOREIGN KEY (submission_id) REFERENCES submissions (id)
);

CREATE TABLE feedback
(
    id               UUID    NOT NULL,
    score_id         UUID    NOT NULL,
    manager_id       UUID    NOT NULL,
    corrected_score  FLOAT,
    notes            TEXT,
    used_for_training BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP,
    CONSTRAINT pk_feedback PRIMARY KEY (id),
    CONSTRAINT fk_feedback_score FOREIGN KEY (score_id) REFERENCES scores (id),
    CONSTRAINT fk_feedback_manager FOREIGN KEY (manager_id) REFERENCES users (id)
);
