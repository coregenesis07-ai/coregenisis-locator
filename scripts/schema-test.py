import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def columns(conn, table):
    return {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}

def test_fresh_schema():
    conn = sqlite3.connect(":memory:")
    conn.executescript((ROOT / "schema.sql").read_text())

    expected_tables = {
        "tracked_inmates", "alert_events", "facilities",
        "regulatory_documents", "bop_policies"
    }
    tables = {r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )}
    missing = expected_tables - tables
    assert not missing, f"fresh schema missing tables: {sorted(missing)}"

    required_tracking = {
        "verification_token", "unsubscribe_token", "verified_at",
        "notification_status", "last_alerted_at", "failure_count",
        "last_error", "updated_at"
    }
    assert required_tracking <= columns(conn, "tracked_inmates")

    required_facility = {
        "city", "security_level", "address", "zip_code",
        "phone_number", "region", "gender", "has_camp",
        "official_url", "last_verified_at"
    }
    assert required_facility <= columns(conn, "facilities")

    # Seed representative records and exercise the major public queries.
    conn.execute("""
        INSERT INTO facilities
        (code,name,state,city,type,security_level,official_url,last_verified_at)
        VALUES ('BCK','FCI Beckley','WV','Beaver','FCI','Medium',
                'https://www.bop.gov/locations/institutions/bck/',datetime('now'))
    """)
    conn.execute("""
        INSERT INTO bop_policies
        (record_number,policy_number,title,document_type,series,issue_date,
         active,source_url,last_verified_at)
        VALUES ('773','5050.51','Compassionate Release/Reduction in Sentence Procedures',
                'ps','5000','09-03-2026',1,
                'https://www.bop.gov/policy/progstat/5050_051.pdf',datetime('now'))
    """)
    conn.execute("""
        INSERT OR REPLACE INTO regulatory_documents
        (slug,title,agency,document_number,document_type,publication_date,
         effective_date,comment_deadline,status,summary,source_url,last_verified_at)
        VALUES ('test-rule','Test Rule','BOP','TEST-1','Rule','2026-09-01',
                '2026-10-01','2026-10-01','Published','First Step test summary',
                'https://www.federalregister.gov/',datetime('now'))
    """)

    # Unified search query shape.
    like = "%beckley%"
    rows = conn.execute("""
        SELECT code,name,state,city,type,security_level,official_url,last_verified_at
        FROM facilities
        WHERE lower(name) LIKE ? OR lower(state) LIKE ? OR lower(city) LIKE ? OR lower(code) LIKE ?
        ORDER BY name LIMIT 10
    """, (like, like, like, like)).fetchall()
    assert rows and rows[0][0] == "BCK"

    # Updates feed query shape.
    rows = conn.execute("""
        SELECT * FROM (
          SELECT 'regulation' AS source_type,title,document_number AS identifier,
                 publication_date AS published_date,source_url,last_verified_at
          FROM regulatory_documents WHERE publication_date IS NOT NULL
          UNION ALL
          SELECT 'bop_policy' AS source_type,title,policy_number AS identifier,
                 CASE WHEN length(issue_date)=10
                   THEN substr(issue_date,7,4)||'-'||substr(issue_date,1,2)||'-'||substr(issue_date,4,2)
                   ELSE NULL END AS published_date,
                 source_url,last_verified_at
          FROM bop_policies WHERE issue_date IS NOT NULL
        )
        WHERE published_date IS NOT NULL
        ORDER BY published_date DESC LIMIT 25
    """).fetchall()
    assert len(rows) >= 2

    # Deadline query shape.
    conn.execute("UPDATE regulatory_documents SET effective_date='2099-10-01', comment_deadline='2099-09-30' WHERE document_number='TEST-1'")
    rows = conn.execute("""
        SELECT slug,title,document_number,source_url,effective_date,comment_deadline
        FROM regulatory_documents
        WHERE (comment_deadline IS NOT NULL AND comment_deadline >= date('now'))
           OR (effective_date IS NOT NULL AND effective_date >= date('now'))
        ORDER BY CASE
          WHEN comment_deadline IS NOT NULL AND effective_date IS NOT NULL
            THEN MIN(comment_deadline,effective_date)
          ELSE COALESCE(comment_deadline,effective_date)
        END ASC
        LIMIT 50
    """).fetchall()
    assert rows

def test_legacy_migration():
    conn = sqlite3.connect(":memory:")
    conn.executescript("""
        CREATE TABLE tracked_inmates (
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
        CREATE INDEX idx_email ON tracked_inmates(email);
        CREATE INDEX idx_register ON tracked_inmates(register_number);
        CREATE TABLE facilities (
          code TEXT PRIMARY KEY,
          name TEXT,
          state TEXT,
          type TEXT
        );
    """)
    conn.executescript((ROOT / "migrations" / "001_coregenisis_v2.sql").read_text())

    assert "verification_token" in columns(conn, "tracked_inmates")
    assert "unsubscribe_token" in columns(conn, "tracked_inmates")
    assert "official_url" in columns(conn, "facilities")

    tables = {r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )}
    for name in ("alert_events", "regulatory_documents", "bop_policies"):
        assert name in tables, f"migration missing {name}"

if __name__ == "__main__":
    test_fresh_schema()
    test_legacy_migration()
    print("Coregenisis schema and migration tests passed.")
