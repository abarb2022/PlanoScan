--liquibase formatted sql

--changeset system:002-store-assignments
CREATE TABLE store_assignment_rules
(
    id                  UUID        NOT NULL,
    store_id            UUID        NOT NULL,
    assignee_id         UUID        NOT NULL,
    assigned_by_user_id UUID        NOT NULL,
    repeat_type         VARCHAR(50) NOT NULL,
    day_of_week         VARCHAR(20) NOT NULL,
    valid_from          DATE        NOT NULL,
    valid_until         DATE,
    created_at          TIMESTAMP,
    CONSTRAINT pk_store_assignment_rules PRIMARY KEY (id),
    CONSTRAINT fk_sar_store FOREIGN KEY (store_id) REFERENCES stores (id),
    CONSTRAINT fk_sar_assignee FOREIGN KEY (assignee_id) REFERENCES users (id),
    CONSTRAINT fk_sar_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES users (id)
);

CREATE INDEX idx_store_assignment_rules_store ON store_assignment_rules (store_id);
CREATE INDEX idx_store_assignment_rules_assignee ON store_assignment_rules (assignee_id);
CREATE INDEX idx_store_assignment_rules_day ON store_assignment_rules (day_of_week);

CREATE TABLE store_assignments
(
    id                  UUID        NOT NULL,
    rule_id             UUID,
    store_id            UUID        NOT NULL,
    assignee_id         UUID        NOT NULL,
    assigned_by_user_id UUID        NOT NULL,
    assignment_date     DATE        NOT NULL,
    status              VARCHAR(50) NOT NULL,
    created_at          TIMESTAMP,
    cancelled_at        TIMESTAMP,
    CONSTRAINT pk_store_assignments PRIMARY KEY (id),
    CONSTRAINT store_assignments_rule_date UNIQUE (rule_id, assignment_date),
    CONSTRAINT fk_sa_rule FOREIGN KEY (rule_id) REFERENCES store_assignment_rules (id),
    CONSTRAINT fk_sa_store FOREIGN KEY (store_id) REFERENCES stores (id),
    CONSTRAINT fk_sa_assignee FOREIGN KEY (assignee_id) REFERENCES users (id),
    CONSTRAINT fk_sa_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES users (id)
);

CREATE INDEX idx_store_assignments_store ON store_assignments (store_id);
CREATE INDEX idx_store_assignments_assignee_date ON store_assignments (assignee_id, assignment_date);
CREATE INDEX idx_store_assignments_status ON store_assignments (status);

ALTER TABLE submissions
    ADD COLUMN assignment_id UUID,
    ADD CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES store_assignments (id);
