-- Coregenisis 2.0 D1 schema
-- Fresh-install schema. Keep migrations/ for an existing database.

CREATE TABLE IF NOT EXISTS tracked_inmates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  register_number TEXT NOT NULL,
  inmate_name TEXT,
  email TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('en','es')),
  last_facility TEXT,
  last_release_date TEXT,
  last_checked DATETIME,
  last_alerted_at DATETIME,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  notification_status TEXT NOT NULL DEFAULT 'active',
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(register_number, email)
);

CREATE INDEX IF NOT EXISTS idx_tracked_email ON tracked_inmates(email);
CREATE INDEX IF NOT EXISTS idx_tracked_register ON tracked_inmates(register_number);
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

CREATE TABLE IF NOT EXISTS facilities (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  city TEXT,
  type TEXT,
  security_level TEXT,
  official_url TEXT,
  last_verified_at DATETIME
);

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
