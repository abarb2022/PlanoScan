--liquibase formatted sql

--changeset system:010-notifications
CREATE TABLE notifications (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id         UUID NOT NULL REFERENCES users(id),
    triggered_by_user_id UUID REFERENCES users(id),
    type                 VARCHAR(50) NOT NULL,
    message              VARCHAR(500) NOT NULL,
    is_read              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, is_read);
