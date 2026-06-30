CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  report_key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('THREAT_SUMMARY', 'RISK_SUMMARY', 'ANALYTICS_SUMMARY', 'NETWORK_STATISTICS', 'EXECUTIVE_BRIEF', 'COMPLIANCE', 'SECURITY_REPORT')),
  format TEXT NOT NULL CHECK (format IN ('JSON', 'TXT')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'ARCHIVED')),
  title TEXT NOT NULL,
  range_start TEXT NOT NULL,
  range_end TEXT NOT NULL,
  content_json TEXT CHECK (content_json IS NULL OR json_valid(content_json)),
  content_text TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  generated_by TEXT,
  generated_at TEXT,
  parameters_json TEXT CHECK (parameters_json IS NULL OR json_valid(parameters_json)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_type_status ON reports(type, status);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
