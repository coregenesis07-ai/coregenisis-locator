-- Federal Custody Guide alert controls migration
-- Apply to the D1 database before enabling verified alert enrollment.

ALTER TABLE tracked_inmates ADD COLUMN status TEXT NOT NULL DEFAULT 'legacy_paused';
ALTER TABLE tracked_inmates ADD COLUMN verify_token_hash TEXT;
ALTER TABLE tracked_inmates ADD COLUMN manage_token_hash TEXT;
ALTER TABLE tracked_inmates ADD COLUMN consent_version TEXT;
ALTER TABLE tracked_inmates ADD COLUMN consented_at DATETIME;
ALTER TABLE tracked_inmates ADD COLUMN verified_at DATETIME;
ALTER TABLE tracked_inmates ADD COLUMN unsubscribed_at DATETIME;
ALTER TABLE tracked_inmates ADD COLUMN expires_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_tracking_status ON tracked_inmates(status);
CREATE INDEX IF NOT EXISTS idx_verify_token_hash ON tracked_inmates(verify_token_hash);
CREATE INDEX IF NOT EXISTS idx_manage_token_hash ON tracked_inmates(manage_token_hash);

CREATE TABLE IF NOT EXISTS alert_suppressions (
  email_hash TEXT PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT 'user_opt_out',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_id INTEGER,
  event TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
