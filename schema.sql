
-- D1 Schema - Free tier (5GB)
-- Run: wrangler d1 execute coregenisis_db --file=./schema.sql

CREATE TABLE IF NOT EXISTS tracked_inmates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  register_number TEXT NOT NULL,
  inmate_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  lang TEXT DEFAULT 'en',
  last_facility TEXT,
  last_release_date TEXT,
  last_checked DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(register_number, email)
);

CREATE INDEX IF NOT EXISTS idx_email ON tracked_inmates(email);
CREATE INDEX IF NOT EXISTS idx_register ON tracked_inmates(register_number);

-- For SEO pages cache (optional)
CREATE TABLE IF NOT EXISTS facilities (
  code TEXT PRIMARY KEY,
  name TEXT,
  state TEXT,
  type TEXT
);
