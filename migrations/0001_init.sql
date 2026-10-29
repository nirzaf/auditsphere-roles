-- Migration: 0001_init
-- Role assignment requests recorded from the Section 9 request builder.

CREATE TABLE IF NOT EXISTS role_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('Staff', 'Client')),
  role_code TEXT NOT NULL,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('FIRM_WIDE', 'GROUP', 'CLIENT', 'ENGAGEMENT')),
  scope_target TEXT NOT NULL DEFAULT '',
  start_date TEXT,
  expiry TEXT,
  approved_by TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_role_requests_email ON role_requests (work_email);
CREATE INDEX IF NOT EXISTS idx_role_requests_created_at ON role_requests (created_at);
