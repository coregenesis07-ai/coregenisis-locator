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
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0,1)),
  notification_status TEXT NOT NULL DEFAULT 'pending_verification',
  verification_token TEXT,
  unsubscribe_token TEXT,
  verified_at DATETIME,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(register_number, email)
);

CREATE INDEX IF NOT EXISTS idx_tracked_email ON tracked_inmates(email);
CREATE INDEX IF NOT EXISTS idx_tracked_register ON tracked_inmates(register_number);
CREATE INDEX IF NOT EXISTS idx_tracked_active ON tracked_inmates(active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tracked_verification_token ON tracked_inmates(verification_token) WHERE verification_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tracked_unsubscribe_token ON tracked_inmates(unsubscribe_token) WHERE unsubscribe_token IS NOT NULL;

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
  address TEXT,
  zip_code TEXT,
  phone_number TEXT,
  region TEXT,
  gender TEXT,
  has_camp INTEGER NOT NULL DEFAULT 0,
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


CREATE TABLE IF NOT EXISTS bop_policies (
  record_number TEXT PRIMARY KEY,
  policy_number TEXT,
  title TEXT NOT NULL,
  document_type TEXT,
  series TEXT,
  issue_date TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  source_url TEXT NOT NULL,
  secondary_url TEXT,
  last_verified_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_bop_policies_number ON bop_policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_bop_policies_series ON bop_policies(series);
CREATE INDEX IF NOT EXISTS idx_bop_policies_issue_date ON bop_policies(issue_date);


CREATE TABLE IF NOT EXISTS service_plans (
  plan_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price_cents INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  public_search INTEGER NOT NULL DEFAULT 1 CHECK (public_search IN (0,1)),
  family_profiles INTEGER NOT NULL DEFAULT 0 CHECK (family_profiles IN (0,1)),
  verified_alerts INTEGER NOT NULL DEFAULT 0 CHECK (verified_alerts IN (0,1)),
  reentry_planner INTEGER NOT NULL DEFAULT 0 CHECK (reentry_planner IN (0,1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO service_plans
(plan_code,name,monthly_price_cents,active,public_search,family_profiles,verified_alerts,reentry_planner)
VALUES
('free','Free',0,1,1,0,0,0),
('family_plus','Family Plus',999,1,1,1,1,0),
('reentry_planner','Reentry Planner',1499,1,1,1,1,1);

CREATE TABLE IF NOT EXISTS customer_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth_subject TEXT NOT NULL UNIQUE,
  email TEXT,
  preferred_lang TEXT NOT NULL DEFAULT 'en' CHECK (preferred_lang IN ('en','es')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account_entitlements (
  customer_account_id INTEGER PRIMARY KEY,
  plan_code TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  valid_until DATETIME,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_code) REFERENCES service_plans(plan_code)
);

CREATE TABLE IF NOT EXISTS family_profiles_private (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  register_number TEXT,
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_family_profiles_account ON family_profiles_private(customer_account_id);

CREATE TABLE IF NOT EXISTS reentry_plans_private (
  customer_account_id INTEGER PRIMARY KEY,
  target_date TEXT,
  checklist_json TEXT NOT NULL DEFAULT '{}',
  housing_notes TEXT,
  employment_notes TEXT,
  next_steps TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  customer_account_id INTEGER,
  processed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE SET NULL
);
