-- Coregenisis 2.0 migration for the original D1 schema.
-- Run ONCE against the existing Coregenisis D1 database.

ALTER TABLE tracked_inmates ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tracked_inmates ADD COLUMN notification_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE tracked_inmates ADD COLUMN last_alerted_at DATETIME;
ALTER TABLE tracked_inmates ADD COLUMN failure_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tracked_inmates ADD COLUMN last_error TEXT;
ALTER TABLE tracked_inmates ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_tracked_active ON tracked_inmates(active);

CREATE TABLE IF NOT EXISTS alert_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracked_inmate_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  sent_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tracked_inmate_id) REFERENCES tracked_inmates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_events_tracked ON alert_events(tracked_inmate_id);

ALTER TABLE facilities ADD COLUMN city TEXT;
ALTER TABLE facilities ADD COLUMN security_level TEXT;
ALTER TABLE facilities ADD COLUMN official_url TEXT;
ALTER TABLE facilities ADD COLUMN last_verified_at DATETIME;

CREATE TABLE IF NOT EXISTS regulatory_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  agency TEXT,
  docket_number TEXT,
  cfr TEXT,
  federal_register_citation TEXT,
  document_number TEXT UNIQUE,
  rin TEXT,
  document_type TEXT,
  publication_date TEXT,
  effective_date TEXT,
  comment_deadline TEXT,
  status TEXT,
  summary TEXT,
  source_url TEXT NOT NULL,
  official_pdf_url TEXT,
  last_verified_at DATETIME
);

INSERT OR IGNORE INTO regulatory_documents (
  slug, title, agency, docket_number, cfr, federal_register_citation,
  document_number, rin, document_type, publication_date, effective_date,
  comment_deadline, status, summary, source_url, last_verified_at
) VALUES (
  'first-step-act-time-credits-revisions-2026',
  'First Step Act Time Credits-Revisions',
  'Department of Justice; Bureau of Prisons',
  'BOP-1183-I',
  '28 CFR 523',
  '91 FR 55740',
  '2026-17752',
  '1120-AB83',
  'Interim final rule; request for comments',
  '2026-08-31',
  '2026-09-30',
  '2026-09-30',
  'Published',
  'BOP revised its First Step Act Time Credits regulation regarding when eligible inmates begin earning credits and eligibility in specified foreign-sentence transfer circumstances.',
  'https://www.federalregister.gov/documents/2026/08/31/2026-17752/first-step-act-time-credits-revisions',
  datetime('now')
);
