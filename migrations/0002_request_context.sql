-- Migration: 0002_request_context
-- Request-level context for role_requests: one submission carries firm/contact
-- details once, plus a shared reference across its rows.

ALTER TABLE role_requests ADD COLUMN request_ref TEXT NOT NULL DEFAULT '';
ALTER TABLE role_requests ADD COLUMN firm_name TEXT NOT NULL DEFAULT '';
ALTER TABLE role_requests ADD COLUMN submitted_by TEXT NOT NULL DEFAULT '';
ALTER TABLE role_requests ADD COLUMN contact_email TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_role_requests_request_ref ON role_requests (request_ref);
